// -----------------------------------------------------------------------------
/**
 * @module steps/__tests__/traceability
 * @description The reshaped spec-to-catalog gate, verdict by verdict. One
 * `.feature` per module holds driveable and not-yet-driveable scenarios side by
 * side, so the gate is no longer a flat "every step matched" flag: each scenario
 * falls in exactly one of `driveable` / `partial` / `notYet`, and only `partial`
 * fails — it reads as driveable and silently is not. Three further drift
 * conditions ride alongside as their own lists: an orphan definition, a pattern
 * a second catalog also claims, and a pattern that does not compile.
 *
 * `featureAcTags` is proven here too, and its return being an ARRAY is a claim
 * in its own right: lodash `difference` reads a `Set` as having no elements, so
 * a `Set` on either side of the AC link would pass vacuously in both directions.
 *
 * ## What Breaks If These Fail
 * A module's spec and the catalog that drives it drift apart in silence — the
 * half-matched scenario nobody runs, the definition nobody calls, the phrasing
 * two modules answer, the AC nobody proves.
 *
 * Negative controls: `traceability-partial-verdict.must-fail.patch`,
 * `traceability-not-yet-verdict.must-fail.patch`,
 * `traceability-cross-catalog-duplicate.must-fail.patch`,
 * `traceability-malformed-preserved.must-fail.patch`,
 * `feature-ac-tags-todo-excluded.must-fail.patch`.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fixtureSteps } from "../../__fixtures__/fixture.steps";
import { STEP_KIND } from "../steps.types";
import { createTraceabilityCheck, featureAcTags } from "../traceability";
import { difference, intersection, isArray, map } from "lodash-es";
import type { StepCatalog, StepCatalogs, StepDef } from "../steps.types";

// -----------------------------------------------------------------------------

const featureText = readFileSync(
  fileURLToPath(new URL("../../__fixtures__/fixture.feature", import.meta.url)),
  "utf-8"
);

const NO_OTHER_CATALOGS: StepCatalogs = {};

const orphan: StepDef = {
  kind: STEP_KIND.GIVEN,
  pattern: "an orphan step nothing in the feature uses",
  handler: () => {}
};

const malformed: StepDef = {
  kind: STEP_KIND.GIVEN,
  pattern: "a value of {unregisteredCustomParameterType}",
  handler: () => {}
};

const withExtraDef = (def: StepDef): StepCatalog => ({
  steps: [...fixtureSteps.steps, def]
});

const MIXED_FEATURE = `
Feature: One file, both states
  Scenario: fully driveable
    Given a fresh fixture switch
    When the switch is turned on
    Then the switch reports itself as on

  Scenario: half driveable
    Given a fresh fixture switch
    Then the switch reports something nobody implemented

  Scenario: not driveable at all
    Given a step nobody registered anywhere
    Then another step nobody registered anywhere
`;

const SHARED_BACKGROUND_FEATURE = `
Feature: A Background every scenario shares
  Background:
    Given a fresh fixture switch

  Scenario: driven
    When the switch is turned on
    Then the switch reports itself as on

  Scenario: written down, not yet driven
    When something nobody implemented happens
    Then something nobody implemented is reported
`;

const AC_FEATURE = `
Feature: AC tags
  @AC-1 @collection
  Scenario: proven
    Given a fresh fixture switch

  @AC-2 @todo
  Scenario: parked
    Given a fresh fixture switch

  @AC-1
  Scenario: proven again by another angle
    Given a fresh fixture switch

  @AC-3
  Scenario: also proven
    Given a fresh fixture switch
`;

// -----------------------------------------------------------------------------

describe("createTraceabilityCheck — one verdict per scenario", () => {
  it("grades the exemplar pair driveable end to end, with nothing left over", () => {
    const result = createTraceabilityCheck(
      featureText,
      fixtureSteps,
      NO_OTHER_CATALOGS
    );

    expect(result.driveable).toStrictEqual(result.scenarios);
    expect(result.partial).toStrictEqual([]);
    expect(result.notYet).toStrictEqual([]);
    expect(result.orphanStepDefs).toStrictEqual([]);
    expect(result.duplicatedPatterns).toStrictEqual([]);
    expect(result.malformedStepDefs).toStrictEqual([]);
  });

  it("partitions every scenario into exactly one bucket, so the driveable-of-total count is total", () => {
    const { scenarios, driveable, partial, notYet } = createTraceabilityCheck(
      MIXED_FEATURE,
      fixtureSteps,
      NO_OTHER_CATALOGS
    );

    expect(driveable.length + partial.length + notYet.length).toBe(
      scenarios.length
    );
    expect(intersection(driveable, partial, notYet)).toStrictEqual([]);
    expect(map(driveable, "name")).toStrictEqual(["fully driveable"]);
  });

  it("FAILS a scenario matched only in part — the case that reads driveable and silently is not", () => {
    const { partial } = createTraceabilityCheck(
      MIXED_FEATURE,
      fixtureSteps,
      NO_OTHER_CATALOGS
    );

    expect(map(partial, "name")).toStrictEqual(["half driveable"]);
  });

  it("PASSES a scenario no step matches at all — a capability written down and not yet driven", () => {
    const { partial, notYet } = createTraceabilityCheck(
      MIXED_FEATURE,
      fixtureSteps,
      NO_OTHER_CATALOGS
    );

    expect(map(notYet, "name")).toStrictEqual(["not driveable at all"]);
    expect(map(partial, "name")).not.toContain("not driveable at all");
  });

  it("does not let a shared IMPLEMENTED Background make an un-stepped scenario partial", () => {
    const { scenarios, driveable, partial, notYet } = createTraceabilityCheck(
      SHARED_BACKGROUND_FEATURE,
      fixtureSteps,
      NO_OTHER_CATALOGS
    );

    expect(map(scenarios, "backgroundStepCount")).toStrictEqual([1, 1]);
    expect(map(driveable, "name")).toStrictEqual(["driven"]);
    expect(map(notYet, "name")).toStrictEqual(["written down, not yet driven"]);
    expect(partial).toStrictEqual([]);
  });
});

describe("createTraceabilityCheck — the drift no bucket carries", () => {
  it("FAILS a step definition matched by no scenario, naming the orphan", () => {
    const { orphanStepDefs, partial } = createTraceabilityCheck(
      featureText,
      withExtraDef(orphan),
      NO_OTHER_CATALOGS
    );

    expect(orphanStepDefs).toStrictEqual([orphan]);
    expect(partial).toStrictEqual([]);
  });

  it("FAILS a pattern a second catalog also claims, naming the modules that claim it", () => {
    const shared = "a fresh fixture switch";
    const catalogs: StepCatalogs = {
      "other-module": {
        steps: [{ kind: STEP_KIND.GIVEN, pattern: shared, handler: () => {} }]
      }
    };

    const { duplicatedPatterns } = createTraceabilityCheck(
      featureText,
      fixtureSteps,
      catalogs
    );

    expect(duplicatedPatterns).toStrictEqual([
      { pattern: shared, modules: ["other-module"] }
    ]);
  });

  it("leaves a pattern no other catalog claims out of the collision list", () => {
    const catalogs: StepCatalogs = {
      "other-module": {
        steps: [
          {
            kind: STEP_KIND.GIVEN,
            pattern: "a phrasing this catalog never uses",
            handler: () => {}
          }
        ]
      }
    };

    const { duplicatedPatterns } = createTraceabilityCheck(
      featureText,
      fixtureSteps,
      catalogs
    );

    expect(duplicatedPatterns).toStrictEqual([]);
  });

  it("FAILS a pattern that does not compile, surfacing it as data rather than throwing", () => {
    let result: ReturnType<typeof createTraceabilityCheck> | undefined;

    expect(() => {
      result = createTraceabilityCheck(
        featureText,
        withExtraDef(malformed),
        NO_OTHER_CATALOGS
      );
    }).not.toThrow();

    expect(map(result?.malformedStepDefs, "pattern")).toStrictEqual([
      malformed.pattern
    ]);
  });

  it("keeps an uncompilable definition out of the orphan list, so one defect is not reported as two", () => {
    const { orphanStepDefs } = createTraceabilityCheck(
      featureText,
      withExtraDef(malformed),
      NO_OTHER_CATALOGS
    );

    expect(orphanStepDefs).toStrictEqual([]);
  });
});

describe("featureAcTags — the AC link's left-hand side", () => {
  it("returns an ARRAY, so lodash difference sees its elements instead of nothing", () => {
    const tags = featureAcTags(AC_FEATURE);

    expect(isArray(tags)).toBe(true);
    expect(difference(tags, ["AC-1"])).toStrictEqual(["AC-3"]);
    expect(difference(["AC-9"], tags)).toStrictEqual(["AC-9"]);
  });

  it("omits the AC id of a @todo-tagged scenario, so a parked capability demands no proof", () => {
    expect(featureAcTags(AC_FEATURE)).toStrictEqual(["AC-1", "AC-3"]);
  });

  it("de-duplicates an AC two scenarios both tag, keeping document order", () => {
    const tags = featureAcTags(`${AC_FEATURE}
  @AC-0
  Scenario: last
    Given a fresh fixture switch
`);

    expect(tags).toStrictEqual(["AC-1", "AC-3", "AC-0"]);
  });
});
