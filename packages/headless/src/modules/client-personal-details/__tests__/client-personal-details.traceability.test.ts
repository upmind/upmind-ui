// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/__tests__/client-personal-details.traceability
 * @description The module's ONE traceability test for the scenario model
 * (operator ruling 2026-09-24): every module capability is a DRIVEN `.feature`
 * scenario or a `@todo` one, so the feature IS the capability contract and the
 * catalog is its proof. This test enforces that link: every non-`@todo` scenario
 * is fully driven (no half-matched step), no step definition is an orphan, no
 * phrasing is duplicated across catalogs, every pattern compiles, and every
 * action the catalog declares covered is fired by some step. It also guards the
 * kept pure unit specs from claiming an `AC` the feature never tags.
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
import {
  clientPersonalDetailsSteps,
  coveredActionIds
} from "./client-personal-details.steps";
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
const SELF = "client-personal-details.traceability.test.ts";

const featureText = readFileSync(
  join(TEST_DIR, "client-personal-details.feature"),
  "utf-8"
);
const catalogSource = readFileSync(
  join(TEST_DIR, "client-personal-details.steps.ts"),
  "utf-8"
);

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(
  featureText,
  clientPersonalDetailsSteps,
  stepCatalogs
);

/** The `AC-<n>` ids carried by the scenarios the catalog drives end to end. */
const drivenAcs = uniq(
  flatMap(driveable, scenario =>
    map(
      [...String(scenario.name ?? "").matchAll(/AC-(\d+)/g)],
      ac => `AC-${ac[1]}`
    ).concat(
      flatMap((scenario.tags ?? []) as string[], tag =>
        map([...tag.matchAll(/AC-(\d+)/g)], ac => `AC-${ac[1]}`)
      )
    )
  )
);

/** Every `@AC-<n>` the feature tags, and the subset carried by `@todo` scenarios. */
function featureAcTags(includeTodo: boolean): string[] {
  const lines = featureText.split("\n");
  const tagged: string[] = [];
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/@AC-(\d+)/);
    if (!match) continue;
    let cursor = index;
    let isTodo = false;
    while (cursor < lines.length && !/^\s*Scenario/.test(lines[cursor])) {
      if (/@todo/.test(lines[cursor])) isTodo = true;
      cursor++;
    }
    if (includeTodo || !isTodo) tagged.push(`AC-${match[1]}`);
  }
  return uniq(tagged);
}

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

describe("client-personal-details traceability — the module's one feature, scenario model", () => {
  it("keeps every unit-spec AC id tagged in the feature", () => {
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
        includes(catalogSource, `CLIENT_PERSONAL_DETAILS_COVERED_ACTIONS.${id}`)
      ),
      "declared covered but fired by no step"
    ).toStrictEqual([]);
  });

  it("proves every non-@todo AC — driven by the World or named by a pure spec", () => {
    const proven = new Set([...drivenAcs, ...acsNamedByUnitSpecs(TEST_DIR)]);
    const unproven = reject(featureAcTags(false), ac => proven.has(ac));

    expect(
      unproven,
      "non-@todo AC(s) with no driving scenario and no pure spec naming them"
    ).toStrictEqual([]);
  });
});
