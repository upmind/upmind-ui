/**
 * @fileoverview Auth traceability, the module's one feature and its catalog
 *
 * ## Job To Be Done
 * Every `@AC-n` the feature tags, on a driven or a `@todo` scenario, is named
 * by a sibling spec title, and no sibling spec names an AC the feature does
 * not tag. The step catalog drives every scenario that is not `@todo`, with no
 * half-matched scenario, no orphan definition, no phrasing another module
 * claims and no pattern that fails to compile. It drives no `@todo` scenario,
 * and it fires every action it declares as covered. It reads the whole
 * feature, the whole catalog and the whole test directory, so no AC or
 * scenario list is written down here.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof, a spec claims an AC no scenario
 * promises, or the playlist plays a scenario the catalog only half drives.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import { authSteps, coveredActionIds } from "./auth.steps";
import {
  difference,
  filter,
  flatMap,
  includes,
  map,
  partition,
  reject,
  uniq
} from "lodash-es";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const SELF = "auth.traceability.test.ts";

const featureText = readFileSync(join(TEST_DIR, "auth.feature"), "utf-8");
const catalogSource = readFileSync(join(TEST_DIR, "auth.steps.ts"), "utf-8");

const {
  scenarios,
  driveable,
  partial,
  orphanStepDefs,
  duplicatedPatterns,
  malformedStepDefs
} = createTraceabilityCheck(featureText, authSteps, stepCatalogs);

const isTodo = (scenario: FeatureScenario): boolean =>
  includes(scenario.tags, "@todo");

const [todoPartial, drivenPartial] = partition(partial, isTodo);

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

describe("auth traceability: the feature, the spec titles and the catalog", () => {
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

  it(`drives ${driveable.length} of ${scenarios.length} scenarios, ${todoPartial.length} declared @todo`, () => {
    expect(
      map(filter(driveable, isTodo), "name"),
      "@todo scenario(s) the catalog drives: a blocked capability plays as proven"
    ).toStrictEqual([]);
    expect(
      map(drivenPartial, "name"),
      "scenario(s) matched only in part: they read as driveable and are not"
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
        includes(catalogSource, `fire(ACTIONS.${id}`)
      ),
      "declared covered but fired by no step"
    ).toStrictEqual([]);
  });
});
