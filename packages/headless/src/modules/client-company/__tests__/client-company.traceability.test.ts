// -----------------------------------------------------------------------------
/**
 * @module client-company/__tests__/client-company.traceability
 * @description The module's ONE traceability test for the scenario model
 * (operator ruling 2026-09-24): every module capability is a DRIVEN `.feature`
 * scenario, so the feature IS the capability contract and the catalog is its
 * proof. This test enforces that link: every non-`@todo` scenario is fully
 * driven (no half-matched step), no step definition is an orphan, no phrasing
 * is duplicated across catalogs, every pattern compiles, and every action the
 * catalog declares covered is fired by some step. It also guards the two kept
 * pure unit specs from claiming an `AC` the feature never tags.
 *
 * ## What Breaks If These Fail
 * A capability reads as driven and silently is not, the playlist plays a
 * scenario nobody implemented, or a unit spec drifts from the feature's tags.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import { clientCompaniesSteps, coveredActionIds } from "./client-company.steps";
import {
  difference,
  filter,
  flatMap,
  includes,
  map,
  reject,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const SELF = "client-company.traceability.test.ts";

const featureText = readFileSync(
  join(TEST_DIR, "client-company.feature"),
  "utf-8"
);
const catalogSource = readFileSync(
  join(TEST_DIR, "client-company.steps.ts"),
  "utf-8"
);

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(featureText, clientCompaniesSteps, stepCatalogs);

/** The `AC-<n>` ids a sibling PURE unit spec claims in a `describe`/`it` title. */
function acsNamedByUnitSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file =>
      file.endsWith(".test.ts") &&
      !file.endsWith(".int.test.ts") &&
      file !== SELF
  );

  return uniq(
    flatMap(specs, file => {
      const titles = readFileSync(join(directory, file), "utf-8").matchAll(
        /(?:describe|it)\(\s*["'`]([^"'`]*)["'`]/g
      );
      return flatMap([...titles], title =>
        map([...title[1].matchAll(/AC-(\d+)/g)], ac => `AC-${ac[1]}`)
      );
    })
  );
}

// -----------------------------------------------------------------------------

describe("client-company traceability — the module's one feature, scenario model", () => {
  it("keeps every unit-spec AC id tagged in the feature", () => {
    // Every `@AC-<n>` the feature carries, `@todo` scenarios included — the
    // unit-proven capabilities (AC-2/3/6/19/28) sit on `@todo` scenarios that
    // `featureAcTags` (driven-only) omits, so the whole tag set is read here.
    const tagged = uniq(
      map([...featureText.matchAll(/@AC-(\d+)/g)], match => `AC-${match[1]}`)
    );
    const named = acsNamedByUnitSpecs(TEST_DIR);

    expect(tagged.length).toBeGreaterThan(0);
    expect(
      difference(named, tagged),
      "unit spec(s) naming an AC the feature does not tag — the spec and the feature drifted apart"
    ).toStrictEqual([]);
  });

  it(`drives ${driveable.length} of ${scenarios.length} scenarios`, () => {
    expect(
      map(partial, "name"),
      "scenario(s) matched only in part — they read as driveable and silently are not"
    ).toStrictEqual([]);
    expect(
      map(orphanStepDefs, "pattern"),
      "step definition(s) no scenario uses"
    ).toStrictEqual([]);
    expect(
      duplicatedPatterns,
      "phrasing(s) another module's catalog also claims"
    ).toStrictEqual([]);
    expect(
      map(malformedStepDefs, "pattern"),
      "step pattern(s) that do not compile as a cucumber expression"
    ).toStrictEqual([]);
    expect(driveable.length).toBeGreaterThan(0);
  });

  it("fires every action it declares as covered", () => {
    expect(
      reject(coveredActionIds, id =>
        includes(catalogSource, `CLIENT_COMPANIES_COVERED_ACTIONS.${id}`)
      ),
      "declared covered but fired by no step"
    ).toStrictEqual([]);
  });
});
