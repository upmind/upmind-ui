// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-pages traceability — every non-@todo scenario
 * has a proving test
 *
 * ## Job To Be Done
 * Read the CO-LOCATED `client-custom-pages.feature`'s `@AC-*` scenario tags
 * (via `@upmind-automation/scenario-harness`'s `featureAcTags`, which already
 * excludes `@todo`-tagged scenarios) and every sibling spec's `AC-<n>` title
 * mentions, then enforce the link BOTH ways: a non-`@todo` scenario with no
 * proving test fails, and a spec naming an AC the feature does not tag
 * (non-`@todo`) fails as a stale/untethered claim. No hardcoded scenario
 * count — a scenario or spec added later is inside this verdict the moment it
 * lands.
 *
 * Some of this feature's scenarios still carry `@todo` (they need data the one
 * configured page cannot supply — see the feature's own header and
 * `client-custom-pages.fixtures.ts`); this gate does not require them to be
 * proven, but does not exempt the ones that are NOT `@todo` (AC-1, AC-2, AC-4,
 * AC-3, AC-5, AC-9, AC-8 — the request-shape, menu set, by-slug resolve,
 * short-circuit, lifecycle and token-transport capabilities provable against
 * the recorded two-page list, 2026-10-06).
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven —
 * or a spec drifts from the capability it claims to cover.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { featureAcTags } from "@upmind-automation/scenario-harness";
import { difference, flatMap, map, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-custom-pages.feature");

const featureText = readFileSync(COLOCATED_FEATURE, "utf-8");

/** The AC ids a sibling spec names in a `describe`/`it` title, as an ARRAY. */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = readdirSync(directory).filter(
    file =>
      (file.endsWith(".test.ts") || file.endsWith(".int.test.ts")) &&
      file !== "client-custom-pages.traceability.test.ts"
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

describe("client-custom-pages traceability — co-located feature vs proving tests", () => {
  it("links every non-@todo scenario to a proving spec, and back", () => {
    const tagged = featureAcTags(featureText);
    const named = acsNamedBySiblingSpecs(TEST_DIR);

    expect(
      difference(tagged, named),
      "Unproven scenarios (no sibling spec names this AC)"
    ).toEqual([]);
    expect(
      difference(named, tagged),
      "Spec(s) name an AC the feature does not define as non-@todo"
    ).toEqual([]);
  });

  it("the non-@todo scenarios are exactly AC-1, AC-2, AC-4, AC-3, AC-5, AC-9 and AC-8, in feature document order", () => {
    expect(featureAcTags(featureText)).toEqual([
      "AC-1",
      "AC-2",
      "AC-4",
      "AC-3",
      "AC-5",
      "AC-9",
      "AC-8"
    ]);
  });
});
