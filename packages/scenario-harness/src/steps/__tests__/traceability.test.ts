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

    // Engine-free means exactly two allowed sources: the package itself
    // (`defineSteps` + type `World`) and this package's own local fixture
    // manifest (`FIXTURE_KEY` from `./fixture-registry`) — never an engine,
    // never a package-wide manifest (item 4: the harness carries no
    // baked-in manifest).
    const allowedSpecifiers = new Set([
      "@upmind-automation/scenario-harness",
      "./fixture-registry"
    ]);
    for (const statement of importStatements) {
      const specifierMatch = /from\s+"([^"]+)"/.exec(statement);
      expect(specifierMatch).not.toBeNull();
      expect(allowedSpecifiers.has(specifierMatch![1])).toBe(true);
    }

    const namedImports = importStatements
      .flatMap(statement => {
        const match = /\{([^}]*)\}/.exec(statement);
        return match ? match[1].split(",") : [];
      })
      .map(name => name.trim())
      .filter(Boolean);

    expect(new Set(namedImports)).toStrictEqual(
      new Set(["defineSteps", "World", "FIXTURE_KEY"])
    );
  });
});

/**
 * @AC-5 — the real `@cucumber/gherkin` AST rewrite: Scenario Outline
 * expansion, Background steps, and DocString/DataTable bodies must never be
 * mistaken for scenario steps of their own.
 */
describe("@AC-5 createTraceabilityCheck — gherkin AST behaviour", () => {
  it("a Scenario Outline's steps match after Examples-row expansion", () => {
    const outlineFeature = `
Feature: Outline expansion
  Scenario Outline: Labelling the switch with different values
    Given a fresh fixture switch
    When the switch is labelled "<label>"
    Then the switch reports a label is set

    Examples:
      | label |
      | demo  |
      | other |
`;

    const result = createTraceabilityCheck(outlineFeature, fixtureSteps);

    // Asserted on unmatchedFeatureSteps only: this synthetic feature doesn't
    // exercise every fixtureSteps entry, so orphanStepDefs (and therefore
    // .ok) legitimately carries unrelated noise unconnected to expansion.
    expect(result.unmatchedFeatureSteps).toStrictEqual([]);
  });

  it("a Background step is counted against the catalog, not dropped", () => {
    const backgroundFeature = `
Feature: Background counts
  Background:
    Given a fresh fixture switch

  Scenario: Turning it on after background boot
    When the switch is turned on
    Then the switch reports itself as on
`;

    const result = createTraceabilityCheck(backgroundFeature, fixtureSteps);

    // Asserted on unmatchedFeatureSteps only — see the Outline test above.
    expect(result.unmatchedFeatureSteps).toStrictEqual([]);
  });

  it("a Background step with no matching definition is still red, naming the unmatched step", () => {
    const backgroundFeature = `
Feature: Background drift is still caught
  Background:
    Given a step nobody registered anywhere

  Scenario: Turning it on after background boot
    When the switch is turned on
    Then the switch reports itself as on
`;

    const result = createTraceabilityCheck(backgroundFeature, fixtureSteps);

    expect(result.ok).toBe(false);
    expect(
      result.unmatchedFeatureSteps.some(
        step => step.text === "a step nobody registered anywhere"
      )
    ).toBe(true);
  });

  it("a DocString body is not parsed as its own step, even one containing a fake Given/When/Then line", () => {
    const docStringFeature = `
Feature: DocStrings are not steps
  Scenario: A step carries a docstring body
    Given a fresh fixture switch
    When the switch is labelled "demo"
    """
    This text is a docstring body attached to the previous step, not a
    step of its own.
    Given this line must never be parsed as a step of its own.
    """
    Then the switch reports a label is set
`;

    const result = createTraceabilityCheck(docStringFeature, fixtureSteps);

    // Asserted on unmatchedFeatureSteps only — see the Outline test above.
    expect(result.unmatchedFeatureSteps).toStrictEqual([]);
  });

  it("a DataTable body is not parsed as its own step", () => {
    const dataTableFeature = `
Feature: DataTables are not steps
  Scenario: A step carries a data table
    Given a fresh fixture switch
    When the switch is turned on
    Then the switch reports itself as on
      | field | value  |
      | mode  | manual |
`;

    const result = createTraceabilityCheck(dataTableFeature, fixtureSteps);

    // Asserted on unmatchedFeatureSteps only — see the Outline test above.
    expect(result.unmatchedFeatureSteps).toStrictEqual([]);
  });

  it("a StepDef whose pattern fails to compile as a cucumber expression surfaces as a structured malformed entry, never a throw", () => {
    const malformedStepDef: StepDef = {
      kind: "Given",
      pattern: "a value of {unregisteredCustomParameterType}",
      handler: () => {}
    };
    const catalog: StepCatalog = {
      steps: [...fixtureSteps.steps, malformedStepDef]
    };

    let result: ReturnType<typeof createTraceabilityCheck> | undefined;
    expect(() => {
      result = createTraceabilityCheck(featureText, catalog);
    }).not.toThrow();

    expect(result?.malformedStepDefs).toContainEqual(
      expect.objectContaining({ pattern: malformedStepDef.pattern })
    );
  });
});
