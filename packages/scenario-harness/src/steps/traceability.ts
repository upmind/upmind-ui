import {
  CucumberExpression,
  ParameterTypeRegistry
} from "@cucumber/cucumber-expressions";
import {
  AstBuilder,
  GherkinClassicTokenMatcher,
  Parser
} from "@cucumber/gherkin";
import { StepKeywordType } from "@cucumber/messages";
import { STEP_KIND } from "./steps.types";
import {
  compact,
  drop,
  every,
  filter,
  first,
  flatMap,
  forEach,
  groupBy,
  includes,
  isEmpty,
  map,
  reduce,
  some,
  uniq
} from "lodash-es";
import type {
  DuplicatedPattern,
  FeatureScenario,
  FeatureStep,
  MalformedStepDef,
  StepCatalog,
  StepCatalogs,
  StepKind,
  StepMatch,
  StepMatcher,
  TraceabilityResult
} from "./steps.types";
import type { Feature, RuleChild, Scenario, Step } from "@cucumber/messages";

// And/But/`*` carry no kind of their own — Conjunction and the bullet form's
// Unknown both inherit the nearest preceding Given/When/Then within the same
// step sequence.
function resolveStepKind(
  keywordType: StepKeywordType | undefined,
  lastKind: StepKind
): StepKind {
  if (keywordType === StepKeywordType.CONTEXT) return STEP_KIND.GIVEN;
  if (keywordType === StepKeywordType.ACTION) return STEP_KIND.WHEN;
  if (keywordType === StepKeywordType.OUTCOME) return STEP_KIND.THEN;
  return lastKind;
}

function collectSteps(steps: readonly Step[]): FeatureStep[] {
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

// A Scenario Outline is not one scenario carrying every row's steps: each
// Examples row is its own playable scenario, taking its name and line from that
// row. A plain Scenario is the one-row case of the same shape.
function expandScenario(scenario: Scenario): FeatureScenario[] {
  const tags = map(scenario.tags, tag => tag.name);
  const steps = collectSteps(scenario.steps);

  if (isEmpty(scenario.examples)) {
    return [
      {
        name: scenario.name,
        tags,
        line: scenario.location.line,
        steps,
        backgroundStepCount: 0
      }
    ];
  }

  return flatMap(scenario.examples, examples => {
    const columns = map(examples.tableHeader?.cells ?? [], cell => cell.value);

    return map(examples.tableBody, row => {
      const values = map(row.cells, cell => cell.value);

      return {
        name: substitutePlaceholders(scenario.name, columns, values),
        tags,
        line: row.location.line,
        steps: map(steps, step => ({
          ...step,
          text: substitutePlaceholders(step.text, columns, values)
        })),
        backgroundStepCount: 0
      };
    });
  });
}

function parseGherkinFeature(featureText: string): Feature | undefined {
  let nextId = 0;
  const builder = new AstBuilder(() => String(nextId++));
  const matcher = new GherkinClassicTokenMatcher();
  const parser = new Parser(builder, matcher);

  return parser.parse(featureText).feature;
}

function collectBackgroundSteps(children: readonly RuleChild[]): FeatureStep[] {
  return flatMap(children, ({ background }) =>
    background ? collectSteps(background.steps) : []
  );
}

function collectScenarios(
  children: readonly RuleChild[],
  backgroundSteps: readonly FeatureStep[]
): FeatureScenario[] {
  return flatMap(children, ({ scenario }) =>
    scenario
      ? map(expandScenario(scenario), expanded => ({
          ...expanded,
          steps: [...backgroundSteps, ...expanded.steps],
          backgroundStepCount: backgroundSteps.length
        }))
      : []
  );
}

/**
 * Parses `featureText` into its scenarios, in document order. Each
 * {@link FeatureScenario} carries its own name, tags and line, and its steps
 * in run order: the enclosing Background's steps (the feature's, then the
 * Rule's own) prefixed to the scenario's — counted in `backgroundStepCount` —
 * with Given/When/Then/And/But/`*` keyword inheritance resolved from the AST.
 *
 * A Scenario Outline yields ONE scenario per Examples row — each carrying the
 * outline's tags, that row's line, and its name and steps with `<column>`
 * substituted from that row — never one scenario holding every row's steps.
 *
 * A Background block is prefixed to every scenario it governs — a scenario is
 * only playable with its Background steps in front of it.
 */
export function parseFeatureScenarios(featureText: string): FeatureScenario[] {
  const feature = parseGherkinFeature(featureText);
  if (!feature) return [];

  const featureBackground = collectBackgroundSteps(feature.children);

  return flatMap(feature.children, child =>
    child.rule
      ? collectScenarios(child.rule.children, [
          ...featureBackground,
          ...collectBackgroundSteps(child.rule.children)
        ])
      : collectScenarios([child], featureBackground)
  );
}

/**
 * Compiles every `catalog` pattern once into a `CucumberExpression` — the same
 * matcher an executor uses at registration time, so a match here is a match
 * there — and matches step text against them. Keyword is cosmetic (real
 * Cucumber runners treat it the same way): a step needs a pattern match, never
 * a kind match.
 *
 * A pattern that fails to compile (e.g. an unregistered custom parameter type)
 * is reported in `malformedStepDefs` instead of throwing, and its index is
 * absent from `compiledIndexes`.
 *
 * @remarks A {@link StepMatch}'s `args` are the parameter types' transformed
 * values, typed as a {@link StepHandler}'s rest parameters take them; an
 * optional group that captured nothing carries cucumber's own `null` through
 * unchanged.
 */
export function createStepMatcher(catalog: StepCatalog): StepMatcher {
  const registry = new ParameterTypeRegistry();
  const malformedStepDefs: MalformedStepDef[] = [];

  const compiled = compact(
    map(catalog.steps, (def, index) => {
      try {
        return {
          index,
          def,
          expression: new CucumberExpression(def.pattern, registry)
        };
      } catch (error) {
        malformedStepDefs.push({
          pattern: def.pattern,
          message: error instanceof Error ? error.message : String(error)
        });
        return undefined;
      }
    })
  );

  const matchAll = (text: string): readonly StepMatch[] =>
    compact(
      map(compiled, ({ index, def, expression }) => {
        const matched = expression.match(text);
        return matched
          ? {
              index,
              def,
              args: map(
                matched,
                argument => argument.getValue<string | number>(null)!
              )
            }
          : undefined;
      })
    );

  return {
    compiledIndexes: new Set(map(compiled, entry => entry.index)),
    malformedStepDefs,
    match: text => first(matchAll(text)),
    matchAll
  };
}

const VERDICT = {
  DRIVEABLE: "driveable",
  PARTIAL: "partial",
  NOT_YET: "notYet"
} as const;

type Verdict = (typeof VERDICT)[keyof typeof VERDICT];

/**
 * A pattern in `catalog` that some OTHER catalog in `catalogs` also registers,
 * with the module keys that claim it. Identity, not key, decides "other", so
 * handing in the whole map — the catalog under check included — is the normal
 * call.
 */
function findDuplicatedPatterns(
  catalog: StepCatalog,
  catalogs: StepCatalogs
): DuplicatedPattern[] {
  const own = new Set(map(catalog.steps, "pattern"));

  const claimants = reduce(
    catalogs,
    (claims: Record<string, string[]>, other, module) => {
      if (other === catalog) return claims;

      forEach(other.steps, ({ pattern }) => {
        if (own.has(pattern)) (claims[pattern] ??= []).push(module);
      });
      return claims;
    },
    {}
  );

  return map(claimants, (modules, pattern) => ({
    pattern,
    modules: uniq(modules)
  }));
}

/**
 * The spec<->catalog drift gate, per scenario. Parses `featureText` with
 * `@cucumber/gherkin`'s real AST parser (Scenario Outline steps are expanded
 * against their Examples rows; Background/Rule steps and Given/When/Then/
 * And/But/`*` keyword inheritance all resolve from the AST, never a line
 * regex) and matches each expanded step's text against every `StepDef` pattern
 * in `catalog` via {@link createStepMatcher}.
 *
 * A module's one `.feature` holds driveable and not-yet-driveable scenarios
 * alike, so the verdict is per scenario rather than a flat step list. Each of
 * `scenarios` lands in exactly one bucket:
 *
 * - `driveable` — every step matched, the Background's included;
 * - `notYet` — none of the scenario's OWN steps matched. A capability written
 *   down and not yet driven, which is a legitimate state; a Background every
 *   sibling shares can therefore never drag an un-stepped scenario into
 *   `partial`;
 * - `partial` — anything between the two, and the only failing bucket: it
 *   reads as driveable and silently is not.
 *
 * Three further red conditions ride alongside: a `StepDef` matched by no
 * scenario is listed in `orphanStepDefs`; a pattern a second catalog in
 * `catalogs` also registers is listed in `duplicatedPatterns`; a `StepDef`
 * pattern that fails to compile as a cucumber expression (e.g. an unregistered
 * custom parameter type) is listed in `malformedStepDefs` instead of throwing.
 * The caller asserts each list empty — there is no aggregate verdict flag,
 * because the driveable-of-total count is a number to read, not to assert.
 *
 * @remarks `@cucumber/cucumber-expressions`, `@cucumber/gherkin` and
 * `@cucumber/messages` are declared in this package's `dependencies`, not
 * `devDependencies`: this module is barrel-exported production src, so the
 * import executes at runtime for every consumer of the package, not only this
 * package's own tests. `@cucumber/messages` is a value import
 * ({@link StepKeywordType}), not a type-only one.
 */
export function createTraceabilityCheck(
  featureText: string,
  catalog: StepCatalog,
  catalogs: StepCatalogs
): TraceabilityResult {
  const matcher = createStepMatcher(catalog);
  const matchedStepDefs = new Set<number>();

  const isMatched = (step: FeatureStep): boolean => {
    const matches = matcher.matchAll(step.text);
    forEach(matches, ({ index }) => matchedStepDefs.add(index));
    return !isEmpty(matches);
  };

  const scenarios = parseFeatureScenarios(featureText);

  const graded = map(scenarios, scenario => {
    // Every step is matched before the verdict is read: `some`/`every` would
    // short-circuit, and an unvisited step leaves its StepDef looking orphaned.
    const matched = map(scenario.steps, isMatched);
    const ownMatched = drop(matched, scenario.backgroundStepCount);

    const verdict: Verdict = !some(ownMatched)
      ? VERDICT.NOT_YET
      : every(matched)
        ? VERDICT.DRIVEABLE
        : VERDICT.PARTIAL;

    return { scenario, verdict };
  });

  const byVerdict = groupBy(graded, "verdict");
  const bucket = (verdict: Verdict): FeatureScenario[] =>
    map(byVerdict[verdict], "scenario");

  return {
    scenarios,
    driveable: bucket(VERDICT.DRIVEABLE),
    partial: bucket(VERDICT.PARTIAL),
    notYet: bucket(VERDICT.NOT_YET),
    orphanStepDefs: filter(
      catalog.steps,
      (_, index) =>
        matcher.compiledIndexes.has(index) && !matchedStepDefs.has(index)
    ),
    duplicatedPatterns: findDuplicatedPatterns(catalog, catalogs),
    malformedStepDefs: matcher.malformedStepDefs
  };
}

const AC_TAG = /^@(AC-\d+)$/;
const TODO_TAG = "@todo";

/**
 * The `AC-<n>` ids tagged on `featureText`'s scenarios, `@todo` ones excluded,
 * de-duplicated and in document order.
 *
 * Returns an ARRAY, never a `Set`: lodash `difference` reads a Set as having no
 * elements, so a Set on either side of the AC-link assertion would pass
 * vacuously in both directions.
 */
export function featureAcTags(featureText: string): string[] {
  return uniq(
    flatMap(parseFeatureScenarios(featureText), ({ tags }) =>
      includes(tags, TODO_TAG)
        ? []
        : compact(map(tags, tag => AC_TAG.exec(tag)?.[1]))
    )
  );
}
