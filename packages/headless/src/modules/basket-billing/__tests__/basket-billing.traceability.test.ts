/**
 * @module basket-billing/__tests__/basket-billing.traceability
 * @description The module's unit-layer AC-link gate. It reads the WHOLE feature
 * and every sibling spec, so there is no hardcoded scenario count and no
 * per-scenario list — a scenario or spec added later is inside this verdict the
 * moment it lands.
 *
 * Scope: the `@layer-unit` scenarios (AC-1..AC-13). The `@layer-integration`
 * scenarios (AC-14..AC-16) are proven under `unified/__tests__/*.int.test.ts`
 * and are the integration layer's traceability responsibility, not this gate's.
 *
 * The verdict: an unlinked unit scenario FAILS (no sibling spec names its AC);
 * a spec naming an AC the feature does not tag FAILS (a stale/untethered test).
 *
 * ## What Breaks If These Fail
 * A billing capability silently loses its proof — shape present, behaviour
 * unproven — or a spec drifts from the capability it claims to cover.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  featureAcTags,
  parseFeatureScenarios
} from "@upmind-automation/scenario-harness";
import {
  compact,
  difference,
  filter,
  flatMap,
  includes,
  map,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const AC_TAG = /^@(AC-\d+)$/;
const LAYER_UNIT = "@layer-unit";

const featureText = readFileSync(
  join(TEST_DIR, "basket-billing.feature"),
  "utf-8"
);

/** The AC ids of the feature's `@layer-unit` scenarios. */
function unitAcTags(text: string): string[] {
  const unitScenarios = filter(parseFeatureScenarios(text), scenario =>
    includes(scenario.tags, LAYER_UNIT)
  );
  return uniq(
    flatMap(unitScenarios, scenario =>
      compact(map(scenario.tags, tag => AC_TAG.exec(tag)?.[1]))
    )
  );
}

/** The AC ids a sibling spec names in a `describe`/`it` title, as an ARRAY. */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file =>
      file.endsWith(".test.ts") &&
      file !== "basket-billing.traceability.test.ts"
  );

  return uniq(
    flatMap(specs, file => {
      const source = readFileSync(join(directory, file), "utf-8");
      const titles = map(
        [...source.matchAll(/(?:describe|it)\(\s*["'`]([^"'`]*)["'`]/g)],
        match => match[1]
      );
      return flatMap(titles, title =>
        map([...title.matchAll(/AC-\d+/g)], hit => hit[0])
      );
    })
  );
}

// -----------------------------------------------------------------------------

describe("basket-billing — the unit-layer AC traceability gate", () => {
  it("links every @layer-unit scenario to a proving spec, and back", () => {
    const unitTagged = unitAcTags(featureText);
    const allTagged = featureAcTags(featureText);
    const named = acsNamedBySiblingSpecs(TEST_DIR);

    expect(
      difference(unitTagged, named),
      "Unproven unit scenarios (no sibling spec names this AC)"
    ).toEqual([]);
    expect(
      difference(named, allTagged),
      "Spec(s) name an AC the feature does not define"
    ).toEqual([]);
  });
});
