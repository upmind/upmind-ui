// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/__tests__/feature-tracks.contract-products.spec
 * @description The COLLECTION's playlist, over the seam — the sibling of
 * `feature-tracks.contract-product.spec.ts`, aimed at the products list page
 * (`useContractProducts`).
 *
 * ## Job To Be Done
 * `featureTracksFor(module)` hands back a playlist only when the seam reaches
 * BOTH halves of a module's committed artefacts: its `.feature` text and its
 * `.steps.ts` catalog (`corpus.source.ts`). The `useContractProducts`
 * declaration says `tracks: { module: "contract-product", without: [...] }`, and
 * asking the seam for that module yields a playlist whose every track is
 * playable against the module's OWN catalog.
 *
 * `stepCatalogs` is keyed by MODULE, so this page and the manager read ONE
 * catalog and one feature. What is per-key is which scenarios the page PLAYS:
 * the list leaves the manager's write, meta and machine lanes
 * (`@manager`, `@meta`, `@machine`) out, and the four scenarios that carry no
 * lane tag (three `@module`, one `@mapping`) reach BOTH pages — the split this
 * spec proves alongside its manager sibling.
 *
 * ## What Breaks If These Fail
 * The products scenario bar lists a manager write it cannot drive, or drops a
 * whole-module guarantee it shares with the manager — with no error anywhere,
 * because a mis-split playlist is a legitimate-looking state.
 *
 * The parser and matcher are the harness's ONE pair, reached through
 * `useFeatureTracks` and `createTraceabilityCheck` — a second copy here would be
 * the defect the seam exists to avoid.
 */

import { describe, expect, it } from "vitest";
import { stepModules } from "@upmind-automation/headless/features";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import listScenario from "../../../useContractProducts/contract-products.scenario";
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
 * whose one feature serves two pages, so the page names the module AND the lanes
 * it does not play (`@manager`, `@meta`, `@machine`). Both halves are read off
 * the declaration rather than restated, so a page that changes lanes moves these
 * assertions with it.
 */
const TRACKED = listScenario.tracks as {
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

describe("the contract-products collection plays its own lane, over the seam", () => {
  it("names a module the seam reaches, taken from the page's own declaration", () => {
    expect(TRACKED_MODULE).toBe("contract-product");
    expect(TRACKED.without).toStrictEqual(["@manager", "@meta", "@machine"]);
    expect(isModuleResolved(TRACKED_MODULE)).toBe(true);
  });

  it("binds the collection surfaces the page lists and opens from", () => {
    expect(listScenario.useList).toBeTypeOf("function");
    expect(listScenario.useDetail).toBeTypeOf("function");
    // No generic write and no self-drawn manager binding on the list page.
    expect("useMutate" in listScenario).toBe(false);
    expect("useManage" in listScenario).toBe(false);
  });

  it("hands back BOTH halves — the playlist text and the catalog that plays it", () => {
    const tracks = source();

    expect(tracks).toBeDefined();
    expect(tracks!.feature.length).toBeGreaterThan(0);
    expect(isEmpty(tracks!.catalog.steps)).toBe(false);
  });

  it("yields a non-empty playlist — the count the scenario bar draws", () => {
    expect(size(playlist().tracks)).toBeGreaterThan(0);
  });

  it("leaves the manager's lanes OUT — the split the paired declaration asks for", () => {
    const names = map(playlist().tracks, "name");

    expect(names).not.toContain("Reset my product to read it afresh");
    expect(names).not.toContain("Know what state each of my products is in");
    expect(names).not.toContain(
      "While a change of mine is in flight, the module says so"
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

  it("boots every track at the client scope the Background arranges", () => {
    expect(
      every(playlist().tracks, track => track.scope?.actor === "client")
    ).toBe(true);
    expect(
      every(playlist().tracks, track => isEmpty(track.scope?.context))
    ).toBe(true);
  });

  it("boots the key this page is registered under, never the manager's", () => {
    // The catalog names the key as a literal (headless holds no scenario
    // concept), so this is the one place the two spellings meet.
    expect(stepModules[TRACKED_MODULE].CONTRACT_PRODUCTS_SCENARIO).toBe(
      listScenario.key
    );
    expect(stepModules[TRACKED_MODULE].CONTRACT_PRODUCT_SCENARIO).not.toBe(
      listScenario.key
    );
  });

  it("declares only action ids its own steps fire", () => {
    expect(isEmpty(stepModules[TRACKED_MODULE].coveredActionIds)).toBe(false);
  });
});
