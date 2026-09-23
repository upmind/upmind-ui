// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/__tests__/feature-tracks.tickets.spec
 * @description The tickets playlist, over the seam — the sibling of
 * `feature-tracks.spec.ts`'s "REAL client-email feature" block, aimed at the
 * one registered module whose picker read `Scenarios (0)`.
 *
 * ## Job To Be Done
 * `featureTracksFor(module)` hands back a playlist only when the seam reaches
 * BOTH halves of a module's committed artefacts: its `.feature` text and its
 * `.steps.ts` catalog (`corpus.source.ts`). `tickets.feature` has been
 * committed since FE-3226's SDD run; `tickets.steps.ts` had not, so the seam
 * yielded `undefined` and `ScenarioPlayground` fell back to Live-only — the
 * CORRECT degraded state (`S12`), and a silent one. A missing catalog and a
 * catalog that stopped matching look identical from the page.
 *
 * So the claim here is the page's own: the `useTickets` declaration says
 * `tracks: "tickets"`, and asking the seam for that module yields a playlist
 * whose every track is playable against the module's OWN catalog.
 *
 * ## What Breaks If These Fail
 * The tickets scenario bar lists nothing, and the whole recorded-replay
 * surface for the module is unreachable from the page that declares it — with
 * no error anywhere, because Live-only is a legitimate state.
 *
 * The parser and matcher are the harness's ONE pair, reached through
 * `useFeatureTracks` and `createTraceabilityCheck` — a second copy here would
 * be the defect the seam exists to avoid.
 */

import { describe, expect, it } from "vitest";
import { stepModules } from "@upmind-automation/headless/features";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import ticketsScenario from "../../../useTickets/tickets.scenario";
import { featureTracksFor, isModuleResolved } from "../../force/corpus.source";
import { useFeatureTracks } from "../useFeatureTracks";
import {
  every,
  filter,
  includes,
  intersection,
  isEmpty,
  map,
  size
} from "lodash-es";

// -----------------------------------------------------------------------------

/**
 * The declaration's `tracks` is the PAIRED form here: `tickets` is the first
 * module whose one feature serves two pages, so the page names the module AND
 * the lane it does not play (`ScenarioTracks`). Both halves are read off the
 * declaration rather than restated, so a page that changes lanes moves these
 * assertions with it.
 */
const TRACKED = ticketsScenario.tracks as {
  module: string;
  without: readonly string[];
};

const TRACKED_MODULE = TRACKED.module;

const source = () => featureTracksFor(TRACKED_MODULE);

const playlist = () =>
  useFeatureTracks({ ...source()!, without: TRACKED.without });

/**
 * The playlist's own oracle, computed by the harness's OTHER reader of the
 * same pair: the module's ONE feature holds its not-yet-driveable scenarios
 * too (ADR-020 Amendment 5), so what the page plays is the driveable subset,
 * never every scenario the file declares.
 */
const driveable = () => {
  const { feature, catalog } = source()!;
  return filter(
    createTraceabilityCheck(feature, catalog, {}).driveable,
    scenario => isEmpty(intersection(scenario.tags, TRACKED.without))
  );
};

// -----------------------------------------------------------------------------

describe("the tickets seam resolves — the picker no longer reads Scenarios (0)", () => {
  it("names a module the seam reaches, taken from the page's own declaration", () => {
    expect(TRACKED_MODULE).toBe("tickets");
    expect(TRACKED.without).toStrictEqual(["@manager"]);
    expect(isModuleResolved(TRACKED_MODULE)).toBe(true);
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

  it("leaves the manager's lane OUT — the split the paired declaration asks for", () => {
    const names = map(playlist().tracks, "name");

    expect(names).not.toContain("Reply to a ticket");
    expect(names).not.toContain("Rename a ticket's subject");
    expect(
      every(playlist().tracks, track => !includes(track.tags, "@manager"))
    ).toBe(true);
  });

  it("carries its OWN lane and nothing else — the split is total", () => {
    // Every driveable tickets scenario belongs to exactly one page: each of the
    // three the feature left untagged turned out to fire a COLLECTION action
    // (`tickets.steps.ts` — `loadDepartmentOptions`, `loadTicketStatuses`,
    // `savePrefs` all live on `useTickets` and nowhere else), so there is
    // no shared scenario to keep. `without` still admits one; none exists here.
    expect(
      every(playlist().tracks, track => includes(track.tags, "@collection"))
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
    // concept), so this is the one place the two spellings meet. The manager
    // page (`ticket`) binds no collection and no editor, so the harness
    // can build no thunk for it — a catalog booting it could never run.
    expect(stepModules[TRACKED_MODULE].TICKETS_SCENARIO).toBe(
      ticketsScenario.key
    );
  });

  it("declares only action ids its own steps fire", () => {
    expect(isEmpty(stepModules[TRACKED_MODULE].coveredActionIds)).toBe(false);
  });
});
