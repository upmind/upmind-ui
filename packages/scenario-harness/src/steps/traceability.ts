import {
  CucumberExpression,
  ParameterTypeRegistry
} from "@cucumber/cucumber-expressions";
import {
  AstBuilder,
  GherkinClassicTokenMatcher,
  Parser
} from "@cucumber/gherkin";
import { STEP_KIND } from "./steps.types";
import type {
  FeatureStep,
  MalformedStepDef,
  StepCatalog,
  StepKind,
  TraceabilityResult
} from "./steps.types";

// Structural subsets of @cucumber/messages' AST shapes — declared locally so
// this module never needs a direct type-import from `@cucumber/messages`
// itself (only `@cucumber/gherkin` is a declared dependency); the real
// parser's output is a structural superset of every shape below.
interface GherkinLocation {
  readonly line: number;
}
interface GherkinTableCell {
  readonly value: string;
}
interface GherkinTableRow {
  readonly cells: readonly GherkinTableCell[];
}
interface GherkinExamples {
  readonly tableHeader?: GherkinTableRow;
  readonly tableBody: readonly GherkinTableRow[];
}
interface GherkinStep {
  readonly location: GherkinLocation;
  readonly keywordType?: string;
  readonly text: string;
}
interface GherkinStepContainer {
  readonly steps: readonly GherkinStep[];
}
interface GherkinScenario extends GherkinStepContainer {
  readonly examples: readonly GherkinExamples[];
}
interface GherkinRuleChild {
  readonly background?: GherkinStepContainer;
  readonly scenario?: GherkinScenario;
}
interface GherkinRule {
  readonly children: readonly GherkinRuleChild[];
}
interface GherkinFeatureChild {
  readonly background?: GherkinStepContainer;
  readonly scenario?: GherkinScenario;
  readonly rule?: GherkinRule;
}
interface GherkinFeature {
  readonly children: readonly GherkinFeatureChild[];
}

// `@cucumber/messages`' StepKeywordType enum values (Given/When/Then are
// pinned to STEP_KIND, this package's own vocabulary; And/But/`*` carry no
// kind of their own — Conjunction and the bullet form's Unknown both inherit
// the nearest preceding Given/When/Then within the same step sequence).
const STEP_KEYWORD_TYPE = {
  CONTEXT: "Context",
  ACTION: "Action",
  OUTCOME: "Outcome"
} as const;

function resolveStepKind(
  keywordType: string | undefined,
  lastKind: StepKind
): StepKind {
  if (keywordType === STEP_KEYWORD_TYPE.CONTEXT) return STEP_KIND.GIVEN;
  if (keywordType === STEP_KEYWORD_TYPE.ACTION) return STEP_KIND.WHEN;
  if (keywordType === STEP_KEYWORD_TYPE.OUTCOME) return STEP_KIND.THEN;
  return lastKind;
}

function collectSteps(steps: readonly GherkinStep[]): FeatureStep[] {
  let lastKind: StepKind = STEP_KIND.GIVEN;

  return steps.map(step => {
    const kind = resolveStepKind(step.keywordType, lastKind);
    lastKind = kind;
    return { kind, text: step.text, line: step.location.line };
  });
}

// `<column>` substitution is a literal-substring replace (never a regex) so a
// placeholder name carrying regex-special characters can never be misread.
function substitutePlaceholders(
  text: string,
  columns: readonly string[],
  values: readonly string[]
): string {
  return columns.reduce(
    (result, column, index) =>
      result.split(`<${column}>`).join(values[index] ?? ""),
    text
  );
}

function expandScenarioSteps(scenario: GherkinScenario): FeatureStep[] {
  if (scenario.examples.length === 0) {
    return collectSteps(scenario.steps);
  }

  const expanded: FeatureStep[] = [];

  for (const examples of scenario.examples) {
    const columns = (examples.tableHeader?.cells ?? []).map(cell => cell.value);

    for (const row of examples.tableBody) {
      const values = row.cells.map(cell => cell.value);
      let lastKind: StepKind = STEP_KIND.GIVEN;

      for (const step of scenario.steps) {
        const kind = resolveStepKind(step.keywordType, lastKind);
        lastKind = kind;
        expanded.push({
          kind,
          text: substitutePlaceholders(step.text, columns, values),
          line: step.location.line
        });
      }
    }
  }

  return expanded;
}

function parseGherkinFeature(featureText: string): GherkinFeature | undefined {
  let nextId = 0;
  const builder = new AstBuilder(() => String(nextId++));
  const matcher = new GherkinClassicTokenMatcher();
  const parser = new Parser(builder, matcher);

  return parser.parse(featureText).feature as GherkinFeature | undefined;
}

function collectContainerSteps(entry: {
  readonly background?: GherkinStepContainer;
  readonly scenario?: GherkinScenario;
}): FeatureStep[] {
  return [
    ...(entry.background ? collectSteps(entry.background.steps) : []),
    ...(entry.scenario ? expandScenarioSteps(entry.scenario) : [])
  ];
}

function collectRuleSteps(rule: GherkinRule): FeatureStep[] {
  return rule.children.flatMap(collectContainerSteps);
}

function parseFeatureSteps(featureText: string): FeatureStep[] {
  const feature = parseGherkinFeature(featureText);
  if (!feature) return [];

  return feature.children.flatMap(child => [
    ...collectContainerSteps(child),
    ...(child.rule ? collectRuleSteps(child.rule) : [])
  ]);
}

/**
 * Bidirectional feature<->steps drift check. Parses `featureText` with
 * `@cucumber/gherkin`'s real AST parser (Scenario Outline steps are expanded
 * against their Examples rows; Background/Rule steps and Given/When/Then/
 * And/But/`*` keyword inheritance all resolve from the AST, never a line
 * regex) and matches each expanded step's text against every `StepDef`
 * pattern in `catalog` via `CucumberExpression` — the same matcher an
 * executor uses at registration time, so a match here is a match there.
 * Keyword is cosmetic for matching (real Cucumber runners treat it the same
 * way): a step only needs a pattern match, never a kind match.
 *
 * FE-2968's per-module conveyor consumes this contract directly: a
 * `<module>.traceability.test.ts` reads its sibling `.feature` and imports
 * its `.steps.ts` catalog, then asserts `createTraceabilityCheck(featureText,
 * catalog).ok` — extending the `client-address-dry.traceability.test.ts`
 * pattern (FE-2968 dry-run) to the feature<->steps pair instead of
 * scenario<->test-id tags. Three red conditions: a feature step matched by no
 * `StepDef` is listed in `unmatchedFeatureSteps`; a `StepDef` matched by no
 * feature step is listed in `orphanStepDefs`; a `StepDef` pattern that fails
 * to compile as a cucumber expression (e.g. an unregistered custom parameter
 * type) is listed in `malformedStepDefs` instead of throwing. `ok` is `true`
 * only when all three are empty.
 *
 * @remarks `@cucumber/cucumber-expressions` and `@cucumber/gherkin` are
 * declared in this package's `dependencies`, not `devDependencies`: this
 * module is barrel-exported production src, so the import executes at
 * runtime for every consumer of the package, not only this package's own
 * tests.
 */
export function createTraceabilityCheck(
  featureText: string,
  catalog: StepCatalog
): TraceabilityResult {
  const registry = new ParameterTypeRegistry();
  const expressions = new Map<number, CucumberExpression>();
  const malformedStepDefs: MalformedStepDef[] = [];

  catalog.steps.forEach((step, index) => {
    try {
      expressions.set(index, new CucumberExpression(step.pattern, registry));
    } catch (error) {
      malformedStepDefs.push({
        pattern: step.pattern,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const matchedStepDefs = new Set<number>();

  const unmatchedFeatureSteps = parseFeatureSteps(featureText).filter(step => {
    let matched = false;
    expressions.forEach((expression, index) => {
      if (expression.match(step.text) !== null) {
        matched = true;
        matchedStepDefs.add(index);
      }
    });
    return !matched;
  });

  const orphanStepDefs = catalog.steps.filter(
    (_, index) => expressions.has(index) && !matchedStepDefs.has(index)
  );

  return {
    ok:
      unmatchedFeatureSteps.length === 0 &&
      orphanStepDefs.length === 0 &&
      malformedStepDefs.length === 0,
    unmatchedFeatureSteps,
    orphanStepDefs,
    malformedStepDefs
  };
}
