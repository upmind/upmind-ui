/**
 * @fileoverview Auth traceability, the module's one feature and its spec titles
 *
 * ## Job To Be Done
 * Every `@AC-n` the feature tags is named by a sibling spec title, and no
 * sibling spec names an AC the feature does not tag. No World boots the
 * landing, so every scenario stays `@todo` and none plays as proven. It reads
 * the whole feature and the whole test directory, so no AC or scenario list is
 * written down here.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof, a spec claims an AC no scenario
 * promises, or a scenario that nothing can boot reads as driven.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTraceabilityCheck,
  defineSteps
} from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import {
  difference,
  filter,
  flatMap,
  includes,
  map,
  reject,
  uniq
} from "lodash-es";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const SELF = "auth.traceability.test.ts";

const featureText = readFileSync(join(TEST_DIR, "auth.feature"), "utf-8");

const { scenarios } = createTraceabilityCheck(
  featureText,
  defineSteps(() => {}),
  stepCatalogs
);

const isTodo = (scenario: FeatureScenario): boolean =>
  includes(scenario.tags, "@todo");

const featureAcs = uniq(
  flatMap(scenarios, scenario =>
    map(
      filter(scenario.tags, tag => /^@AC-\d+$/.test(tag)),
      tag => tag.slice(1)
    )
  )
);

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

describe("auth traceability: the feature and the spec titles", () => {
  it("names every tagged AC in a spec title, and tags every AC a spec names", () => {
    const named = acsNamedBySiblingSpecs(TEST_DIR);

    expect(featureAcs.length).toBeGreaterThan(0);
    expect(
      difference(featureAcs, named),
      "AC(s) the feature tags that no spec names: shape present, behaviour unproven"
    ).toStrictEqual([]);
    expect(
      difference(named, featureAcs),
      "spec(s) naming an AC the feature does not tag"
    ).toStrictEqual([]);
  });

  it("declares every scenario @todo, so no unbootable scenario reads as driven", () => {
    expect(scenarios.length).toBeGreaterThan(0);
    expect(
      map(reject(scenarios, isTodo), "name"),
      "scenario(s) with no @todo that no World can boot"
    ).toStrictEqual([]);
  });
});
