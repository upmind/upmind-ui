/**
 * @fileoverview Auth traceability, the AC link of the module's one feature
 *
 * ## Job To Be Done
 * Every `@AC-n` the feature tags is named by a sibling spec title, and no
 * sibling spec names an AC the feature does not tag. It reads the whole feature
 * and the whole test directory, so no AC list is written down here.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof, or a spec claims an AC no scenario
 * promises.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { featureAcTags } from "@upmind-automation/scenario-harness";
import { difference, filter, flatMap, map, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const SELF = "auth.traceability.test.ts";

const featureText = readFileSync(join(TEST_DIR, "auth.feature"), "utf-8");

/**
 * The `AC-<n>` ids a sibling spec claims in a `describe` or `it` title.
 *
 * @param directory The directory whose `*.test.ts` files are read.
 */
function acsNamedBySiblingSpecs(directory: string): string[] {
  const specs = filter(
    readdirSync(directory),
    file => file.endsWith(".test.ts") && file !== SELF
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

describe("auth traceability: the feature tags and the spec titles", () => {
  it("names every tagged AC in a spec title, and tags every AC a spec names", () => {
    const tagged = featureAcTags(featureText);
    const named = acsNamedBySiblingSpecs(TEST_DIR);

    expect(tagged.length).toBeGreaterThan(0);
    expect(
      difference(tagged, named),
      "AC(s) the feature tags that no spec names: shape present, behaviour unproven"
    ).toStrictEqual([]);
    expect(
      difference(named, tagged),
      "spec(s) naming an AC the feature does not tag"
    ).toStrictEqual([]);
  });
});
