import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fixtureSteps } from "../../__fixtures__/fixture.steps";
import { createTraceabilityCheck } from "../traceability";
import type { StepCatalog, StepDef } from "../steps.types";

const featureText = readFileSync(
  fileURLToPath(new URL("../../__fixtures__/fixture.feature", import.meta.url)),
  "utf-8"
);
const stepsSourceText = readFileSync(
  fileURLToPath(
    new URL("../../__fixtures__/fixture.steps.ts", import.meta.url)
  ),
  "utf-8"
);

/**
 * @AC-5 — the feature<->steps drift check, both directions, over the real
 * @AC-5 exemplar pair (`__fixtures__/fixture.feature` + `fixture.steps.ts`).
 */
describe("@AC-5 createTraceabilityCheck — the BDD pair stays in lockstep", () => {
  it("the exemplar pair runs green end to end (bdd @AC-5 scenario 1)", () => {
    const result = createTraceabilityCheck(featureText, fixtureSteps);

    expect(result.ok).toBe(true);
    expect(result.unmatchedFeatureSteps).toStrictEqual([]);
    expect(result.orphanStepDefs).toStrictEqual([]);
  });

  it("a feature step with no matching step definition is red, naming the unmatched step (bdd @AC-5 scenario 2)", () => {
    const driftedFeature = `${featureText}

  Scenario: An orphaned scenario step
    Given a step nobody registered anywhere
`;

    const result = createTraceabilityCheck(driftedFeature, fixtureSteps);

    expect(result.ok).toBe(false);
    expect(result.orphanStepDefs).toStrictEqual([]);
    expect(
      result.unmatchedFeatureSteps.some(
        step => step.text === "a step nobody registered anywhere"
      )
    ).toBe(true);
  });

  it("a step definition matching no feature step is red, naming the orphan definition (bdd @AC-5 scenario 3)", () => {
    const orphanStepDef: StepDef = {
      kind: "Given",
      pattern: "an orphan step nothing in the feature uses",
      handler: () => {}
    };
    const driftedCatalog: StepCatalog = {
      steps: [...fixtureSteps.steps, orphanStepDef]
    };

    const result = createTraceabilityCheck(featureText, driftedCatalog);

    expect(result.ok).toBe(false);
    expect(result.unmatchedFeatureSteps).toStrictEqual([]);
    expect(result.orphanStepDefs).toContainEqual(orphanStepDef);
  });

  it("the exemplar step definitions' import surface is exactly the allowed trio (bdd @AC-5 scenario 4)", () => {
    const importStatements = [
      ...stepsSourceText.matchAll(/^import\b[\s\S]*?;/gm)
    ].map(match => match[0]);

    expect(importStatements.length).toBeGreaterThan(0);

    for (const statement of importStatements) {
      expect(statement).toContain('"@upmind-automation/scenario-harness"');
    }

    const namedImports = importStatements
      .flatMap(statement => {
        const match = /\{([^}]*)\}/.exec(statement);
        return match ? match[1].split(",") : [];
      })
      .map(name => name.trim())
      .filter(Boolean);

    expect(new Set(namedImports)).toStrictEqual(
      new Set(["COMPOSABLE_KEY", "defineSteps", "World"])
    );
  });
});
