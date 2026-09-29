// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/__tests__/feature-tracks.contract-product.spec
 * @description The MANAGER's playlist, over the same seam — the sibling of
 * `feature-tracks.contract-products.spec.ts`, aimed at the self-drawn per-product
 * page (`useContractProduct`).
 *
 * ## Job To Be Done
 * `useContractProduct` DRAWS ITS OWN page: the two write forms open from their
 * own context slots and the formless writes take no argument a generic panel
 * could gather blind, so the shared `ScenarioPlayground` never hosts it. The
 * declaration opts in with `useManage` + `tracks`, and the page mounts its own
 * scenario bar. So the claim here is the page's own: asking the seam for the
 * module this declaration tracks yields a playlist whose every track is playable
 * against the module's OWN catalog.
 *
 * `stepCatalogs` is keyed by MODULE, so this page and the collection read ONE
 * catalog and one feature. What is per-key is which scenarios the page PLAYS:
 * the manager leaves the collection's lane (`@collection`) out, and the four
 * scenarios that carry no lane tag (three `@module`, one `@mapping`) reach BOTH
 * pages — the split this spec proves alongside its collection sibling.
 *
 * ## What Breaks If These Fail
 * The manager's scenario bar lists the collection's paging and category reads it
 * cannot drive, or drops a whole-module guarantee it shares with the list — with
 * no error anywhere, because a mis-split playlist is a legitimate-looking state.
 *
 * The parser and matcher are the harness's ONE pair, reached through
 * `useFeatureTracks` and `createTraceabilityCheck` — a second copy here would be
 * the defect the seam exists to avoid.
 */

import { describe, expect, it } from "vitest";
import { stepModules } from "@upmind-automation/headless/features";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import managerScenario from "../../../useContractProduct/contract-product.scenario";
import { featureTracksFor, isModuleResolved } from "../../force/corpus.source";
import { useFeatureTracks } from "../useFeatureTracks";
import {
  every,
  filter,
  intersection,
  isEmpty,
  map,
  size,
  some,
  startsWith
} from "lodash-es";

// -----------------------------------------------------------------------------

/**
 * The declaration's `tracks` is the PAIRED form: `contract-product` is a module
 * whose one feature serves two pages, so the page names the module AND the lane
 * it does not play (`@collection`). Both halves are read off the declaration
 * rather than restated, so a page that changes lanes moves these assertions with
 * it.
 */
const TRACKED = managerScenario.tracks as {
  module: string;
  without: readonly string[];
};

const TRACKED_MODULE = TRACKED.module;

const source = () => featureTracksFor(TRACKED_MODULE);

const playlist = () =>
  useFeatureTracks({ ...source()!, without: TRACKED.without });

/**
 * The playlist's own oracle, computed by the harness's OTHER reader of the same
 * pair: the module's ONE feature holds its not-yet-driveable scenarios too
 * (ADR-020 Amendment 5), so what the page plays is the driveable subset, never
 * every scenario the file declares.
 */
const driveable = () => {
  const { feature, catalog } = source()!;
  return filter(
    createTraceabilityCheck(feature, catalog, {}).driveable,
    scenario => isEmpty(intersection(scenario.tags, TRACKED.without))
  );
};

/**
 * The four lanes the paired feature tags with; a scenario carrying none of them
 * belongs to no single page and reaches both.
 */
const LANE_TAGS = ["@collection", "@manager", "@meta", "@machine"];

/**
 * The scenarios that carry no lane tag — the three `@module` guarantees and the
 * one `@mapping` promise the declaration says reach both pages. Named, so
 * tagging one into a lane (and dropping it from a page) is a failure rather than
 * a number that quietly moved.
 */
const UNTAGGED_BOTH = [
  "Nothing is read or changed on my products without an authenticated client session",
  "The account I act on is the one my scope resolved",
  "No staff route is ever reachable from my product surfaces",
  "What I am given is the module's own shape, not the server's"
];

const untagged = () => {
  const { feature, catalog } = source()!;
  return filter(
    createTraceabilityCheck(feature, catalog, {}).scenarios,
    scenario => isEmpty(intersection(scenario.tags, LANE_TAGS))
  );
};

// -----------------------------------------------------------------------------

describe("the contract-product manager plays its own lane, over the seam", () => {
  it("declares the module the seam reaches, taken from the page's own declaration", () => {
    expect(TRACKED_MODULE).toBe("contract-product");
    expect(TRACKED.without).toStrictEqual(["@collection"]);
    expect(isModuleResolved(TRACKED_MODULE)).toBe(true);
  });

  it("binds a composable so the harness can build a boot thunk for this key", () => {
    expect(managerScenario.useManage).toBeTypeOf("function");
    // Still self-drawn: no generic list or mutate surface is involved.
    expect("useList" in managerScenario).toBe(false);
    expect("useMutate" in managerScenario).toBe(false);
  });

  it("hands back BOTH halves — the playlist text and the catalog that plays it", () => {
    const tracks = source();

    expect(tracks).toBeDefined();
    expect(tracks!.feature.length).toBeGreaterThan(0);
    expect(isEmpty(tracks!.catalog.steps)).toBe(false);
  });

  it("yields a non-empty playlist — the count the manager's scenario bar draws", () => {
    expect(size(playlist().tracks)).toBeGreaterThan(0);
  });

  it("leaves the collection's lane OUT — the split the paired declaration asks for", () => {
    const names = map(playlist().tracks, "name");

    expect(names).not.toContain("See the products on my own account");
    expect(names).not.toContain(
      "Browse the categories I have already bought into"
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

  it("carries the untagged scenarios the paired declaration sends to both pages", () => {
    const scenarios = untagged();

    expect(scenarios.length).toBeGreaterThan(0);
    // The lane-less family is exactly `@module` and `@mapping` — nothing else
    // lost its lane tag into this set.
    expect(
      every(
        scenarios,
        scenario =>
          !isEmpty(intersection(scenario.tags, ["@module", "@mapping"]))
      )
    ).toBe(true);
    // Each named base scenario is present, itself or expanded per Examples row.
    expect(
      every(UNTAGGED_BOTH, base =>
        some(
          scenarios,
          scenario =>
            scenario.name === base || startsWith(scenario.name, `${base} — `)
        )
      )
    ).toBe(true);
    // None is excluded by this page — the untagged reach it.
    expect(
      every(scenarios, scenario =>
        isEmpty(intersection(scenario.tags, TRACKED.without))
      )
    ).toBe(true);
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

  it("boots every track at the client scope the page is already on", () => {
    // Actor only, and no context: the product id is the URL's
    // (`/useContractProduct/<id>`) and no catalog can name it, so the page's own
    // world completes the record.
    expect(
      every(playlist().tracks, track => track.scope?.actor === "client")
    ).toBe(true);
    expect(
      every(playlist().tracks, track => isEmpty(track.scope?.context))
    ).toBe(true);
  });

  it("boots the key THIS page is registered under, never the collection's", () => {
    // The catalog names both keys as literals (headless holds no scenario
    // concept), so this is the one place the two spellings meet.
    expect(stepModules[TRACKED_MODULE].CONTRACT_PRODUCT_SCENARIO).toBe(
      managerScenario.key
    );
    expect(stepModules[TRACKED_MODULE].CONTRACT_PRODUCTS_SCENARIO).not.toBe(
      managerScenario.key
    );
  });
});
