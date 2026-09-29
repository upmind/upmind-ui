// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/__tests__/feature-tracks.contracts.spec
 * @description The contracts COLLECTION's playlist, over the seam — the sibling
 * of `feature-tracks.contract.spec.ts`, aimed at the contracts list page
 * (`useContracts`).
 *
 * ## Job To Be Done
 * `featureTracksFor(module)` hands back a playlist only when the seam reaches
 * BOTH halves of a module's committed artefacts: its `.feature` text and its
 * `.steps.ts` catalog. The `useContracts` declaration tracks the `contract`
 * module without the manager's lanes (`@manager`, `@meta`), so a client can
 * replay reading, paging, narrowing and ordering their contracts by hand.
 *
 * ## What Breaks If These Fail
 * The contracts scenario bar lists a manager track it cannot drive, drops a
 * list track the catalog plays, or lists a track the catalog only half-drives
 * — with no error anywhere, because a mis-split playlist is a
 * legitimate-looking state.
 */

import { describe, expect, it } from "vitest";
import { stepModules } from "@upmind-automation/headless/features";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import listScenario from "../../../useContracts/contracts.scenario";
import { featureTracksFor, isModuleResolved } from "../../force/corpus.source";
import { useFeatureTracks } from "../useFeatureTracks";
import { every, filter, intersection, isEmpty, map, size } from "lodash-es";

// -----------------------------------------------------------------------------

const TRACKED = listScenario.tracks as {
  module: string;
  without: readonly string[];
};

const TRACKED_MODULE = TRACKED.module;

const source = () => featureTracksFor(TRACKED_MODULE);

const playlist = () =>
  useFeatureTracks({ ...source()!, without: TRACKED.without });

const driveable = () => {
  const { feature, catalog } = source()!;
  return filter(
    createTraceabilityCheck(feature, catalog, {}).driveable,
    scenario => isEmpty(intersection(scenario.tags, TRACKED.without))
  );
};

// -----------------------------------------------------------------------------

describe("the contracts collection plays its own lane, over the seam", () => {
  it("names a module the seam reaches, taken from the page's own declaration", () => {
    expect(TRACKED_MODULE).toBe("contract");
    expect(TRACKED.without).toStrictEqual(["@manager", "@meta"]);
    expect(isModuleResolved(TRACKED_MODULE)).toBe(true);
  });

  it("yields a non-empty playlist — the count the scenario bar draws", () => {
    expect(size(playlist().tracks)).toBeGreaterThan(0);
  });

  it("plays the list's own tracks — reading, paging, narrowing and ordering", () => {
    const names = map(playlist().tracks, "name");

    expect(names).toContain("See the contracts on my own account");
    expect(names).toContain("Narrow my contracts to the ones I want");
    expect(names).toContain("Order my contracts");
    expect(names).toContain(
      "Each of my contracts shows when it next bills, how often, when I bought it and what it costs"
    );
  });

  it("leaves the manager's lanes OUT — the split the paired declaration asks for", () => {
    const names = map(playlist().tracks, "name");

    expect(names).not.toContain(
      "The contract I have open lists its products, each by its own id"
    );
    expect(
      every(playlist().tracks, track =>
        isEmpty(intersection(track.tags, TRACKED.without))
      )
    ).toBe(true);
  });

  it("plays the driveable subset, named exactly as the committed feature declares them", () => {
    expect(map(playlist().tracks, "name")).toStrictEqual(
      map(driveable(), "name")
    );
  });

  it("matches every scene against the module's OWN catalog — the whole playlist is playable", () => {
    const { tracks, malformedStepDefs } = playlist();

    expect(malformedStepDefs).toStrictEqual([]);
    expect(
      map(
        filter(tracks, track => !track.isPlayable),
        "name"
      )
    ).toStrictEqual([]);
  });

  it("gives each track the scenes the feature declares for it, Background first", () => {
    expect(
      map(playlist().tracks, track => map(track.scenes, "text"))
    ).toStrictEqual(map(driveable(), scenario => map(scenario.steps, "text")));
  });

  it("boots the key this page is registered under, never the manager's", () => {
    expect(stepModules[TRACKED_MODULE].CONTRACTS_SCENARIO).toBe(
      listScenario.key
    );
    expect(stepModules[TRACKED_MODULE].CONTRACT_SCENARIO).not.toBe(
      listScenario.key
    );
  });
});
