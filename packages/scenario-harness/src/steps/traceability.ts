import {
  CucumberExpression,
  ParameterTypeRegistry
} from "@cucumber/cucumber-expressions";
import type { StepCatalog, StepDef, StepKind } from "./steps.types";

const STEP_LINE = /^(Given|When|Then|And|But)\s+(.+)$/;
const SCENARIO_HEADER = /^(Scenario|Scenario Outline|Background):/;

export interface FeatureStep {
  readonly kind: StepKind;
  readonly text: string;
  readonly line: number;
}

export interface TraceabilityResult {
  readonly ok: boolean;
  readonly unmatchedFeatureSteps: readonly FeatureStep[];
  readonly orphanStepDefs: readonly StepDef[];
}

// And/But steps carry the kind of the nearest preceding Given/When/Then
// within the same scenario (Gherkin semantics); the boundary resets per
// Scenario/Scenario Outline/Background block so it never leaks across them.
function parseFeatureSteps(featureText: string): FeatureStep[] {
  const steps: FeatureStep[] = [];
  let lastKind: StepKind = "Given";

  featureText.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (SCENARIO_HEADER.test(line)) {
      lastKind = "Given";
      return;
    }

    const match = STEP_LINE.exec(line);
    if (!match) return;

    const [, keyword, text] = match;
    const kind: StepKind =
      keyword === "And" || keyword === "But" ? lastKind : (keyword as StepKind);
    lastKind = kind;

    steps.push({ kind, text, line: index + 1 });
  });

  return steps;
}

/**
 * Bidirectional feature<->steps drift check (design §4, ruling 3's drift
 * clause). Parses `featureText` with a minimal Given/When/Then/And/But line
 * grammar and matches each step's text against every {@link StepDef} pattern
 * in `catalog` via `CucumberExpression` — the same matcher an executor uses
 * at registration time, so a match here is a match there. Keyword is cosmetic
 * for matching (real Cucumber runners treat it the same way): a step only
 * needs a pattern match, never a kind match.
 *
 * FE-2968's per-module conveyor consumes this contract directly: a
 * `<module>.traceability.test.ts` reads its sibling `.feature` and imports
 * its `.steps.ts` catalog, then asserts `createTraceabilityCheck(featureText,
 * catalog).ok` — extending the `client-address-dry.traceability.test.ts`
 * pattern (FE-2968 dry-run) to the feature<->steps pair instead of
 * scenario<->test-id tags. Both directions are red conditions: a feature step
 * matched by no `StepDef` is listed in `unmatchedFeatureSteps`; a `StepDef`
 * matched by no feature step is listed in `orphanStepDefs`. `ok` is `true`
 * only when both are empty.
 *
 * @remarks `@cucumber/cucumber-expressions` is declared in this package's
 * `dependencies`, not `devDependencies` (design §1 anticipated dev-only use):
 * this module is barrel-exported production src, so the import executes at
 * runtime for every consumer of the package, not only this package's own
 * tests.
 */
export function createTraceabilityCheck(
  featureText: string,
  catalog: StepCatalog
): TraceabilityResult {
  const registry = new ParameterTypeRegistry();
  const expressions = catalog.steps.map(
    step => new CucumberExpression(step.pattern, registry)
  );

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
    (_, index) => !matchedStepDefs.has(index)
  );

  return {
    ok: unmatchedFeatureSteps.length === 0 && orphanStepDefs.length === 0,
    unmatchedFeatureSteps,
    orphanStepDefs
  };
}
