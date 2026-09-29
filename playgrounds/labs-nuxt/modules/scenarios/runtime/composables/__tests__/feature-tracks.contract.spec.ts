// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/__tests__/feature-tracks.contract.spec
 * @description The contract MANAGER's playlist, over the same seam — the
 * sibling of `feature-tracks.contracts.spec.ts`, aimed at the self-drawn
 * per-contract page (`useContract`).
 *
 * ## Job To Be Done
 * `useContract` DRAWS ITS OWN page and opts in with `useManage` + `tracks`.
 * Asking the seam for the module it tracks yields a playlist, without the
 * list's lane (`@collection`), whose every track is playable against the
 * module's OWN catalog — the manager's one JOURNEY, changing the contract's
 * payment method to a different stored card. The contract read-backs (the
 * record, its title, its products) are CHECKS, not journeys (R38 item 4), so
 * they are spec-only and the bar never lists them; the manager's transport
 * states (loading, errored) are its forced states, proven separately.
 *
 * ## What Breaks If These Fail
 * The manager's scenario bar lists the list's paging and narrowing it cannot
 * drive, drops the payment-method change it can, or restates a read-back check
 * as a story — with no error anywhere.
 */

import { describe, expect, it } from "vitest";
import { stepModules } from "@upmind-automation/headless/features";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import managerScenario from "../../../useContract/contract.scenario";
import { featureTracksFor, isModuleResolved } from "../../force/corpus.source";
import { useFeatureTracks } from "../useFeatureTracks";
import { every, filter, intersection, isEmpty, map, size } from "lodash-es";

// -----------------------------------------------------------------------------

const TRACKED = managerScenario.tracks as {
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

describe("the contract manager plays its own lane, over the seam", () => {
  it("declares the module the seam reaches, taken from the page's own declaration", () => {
    expect(TRACKED_MODULE).toBe("contract");
    expect(TRACKED.without).toStrictEqual(["@collection"]);
    expect(isModuleResolved(TRACKED_MODULE)).toBe(true);
  });

  it("binds a composable so the harness can build a boot thunk for this key", () => {
    expect(managerScenario.useManage).toBeTypeOf("function");
    expect("useList" in managerScenario).toBe(false);
    expect("useMutate" in managerScenario).toBe(false);
  });

  it("yields a non-empty playlist — the count the manager's scenario bar draws", () => {
    expect(size(playlist().tracks)).toBeGreaterThan(0);
  });

  it("plays the manager's own write journey — changing the payment method — and lists no read-back check", () => {
    const names = map(playlist().tracks, "name");

    // The one manager JOURNEY a client drives: change the payment method to a
    // different stored card (R38 item 4 — the bar lists journeys, not checks).
    expect(names).toContain(
      "Change my open contract to a different stored card"
    );

    // The read-backs are CHECKS, proven at integration, so the bar lists none.
    expect(names).not.toContain(
      "The contract I have open carries everything the manager read about it"
    );
    expect(names).not.toContain(
      "The contract I have open is titled by the order it was bought under"
    );
    expect(names).not.toContain(
      "The contract I have open lists its products, each by its own id"
    );
  });

  it("leaves the collection's lane OUT — the split the paired declaration asks for", () => {
    const names = map(playlist().tracks, "name");

    expect(names).not.toContain("See the contracts on my own account");
    expect(names).not.toContain("Order my contracts");
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

  it("boots the key THIS page is registered under, never the collection's", () => {
    expect(stepModules[TRACKED_MODULE].CONTRACT_SCENARIO).toBe(
      managerScenario.key
    );
    expect(stepModules[TRACKED_MODULE].CONTRACTS_SCENARIO).not.toBe(
      managerScenario.key
    );
  });
});
