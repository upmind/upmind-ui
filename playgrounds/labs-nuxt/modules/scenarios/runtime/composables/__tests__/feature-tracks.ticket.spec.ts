// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/__tests__/feature-tracks.ticket.spec
 * @description The MANAGER's playlist, over the same seam — the sibling of
 * `feature-tracks.tickets.spec.ts`, aimed at the page that had no scenario bar
 * at all.
 *
 * ## Job To Be Done
 * `useTicket` DRAWS ITS OWN page: no generic surface can render a message
 * thread or a reply composer, so the shared `ScenarioPlayground` never hosts it.
 * Until FE-3226 that also meant no playlist — the declaration bound no
 * composable, so it was outside the registry's `boundKeys`, `World.boot` on its
 * key threw, and it declared no `tracks` because nothing would have read them.
 *
 * The declaration now opts in (`useManage` + `tracks`), and the page mounts
 * `ScenarioBar` itself. So the claim here is the page's own, and it is the same
 * mechanical claim its collection sibling makes: asking the seam for the module
 * this declaration tracks yields a playlist whose every track is playable
 * against the module's OWN catalog.
 *
 * `stepCatalogs` is keyed by MODULE, so both keys read ONE catalog and one
 * playlist — which is why the driveable set below is the whole module's, not a
 * per-key slice. What is per-key is which scenarios EARNED steps, and the
 * manager's own are named here so an exclusion cannot be quietly widened.
 *
 * ## What Breaks If These Fail
 * The manager's scenario bar lists nothing, and 32 proven capabilities — reply,
 * close, rename, the thread, the attachments view, the per-message re-read, the
 * product link — go back to being unplayable from the page that owns them, with
 * no error anywhere, because Live-only is a legitimate state (`S12`).
 *
 * The parser and matcher are the harness's ONE pair, reached through
 * `useFeatureTracks` and `createTraceabilityCheck` — a second copy here would
 * be the defect the seam exists to avoid.
 */

import { describe, expect, it } from "vitest";
import { stepModules } from "@upmind-automation/headless/features";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import managerScenario from "../../../useTicket/ticket.scenario";
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
 * The manager scenarios that EARNED steps — every line of each driven against
 * the composable this key boots. Named, so widening an exclusion into a track
 * (or losing one) is a failure rather than a number that quietly moved.
 */
const MANAGER_TRACKS = [
  "Open one of my tickets",
  "Know the state of the ticket I am reading",
  "Link, change, and unlink the product a ticket is about",
  "Read the conversation on a ticket",
  "Read further back in a long conversation",
  "See only the messages that carry files",
  "Re-read one message on its own",
  "Reply to a ticket",
  "Close a ticket I no longer need help with",
  "Rename a ticket's subject"
];

/**
 * The manager scenarios that earned NONE, each for a reason the catalog names
 * with the spec that proves it instead: a two-argument write `World.fire`
 * cannot reach, a recording that does not exist, a returned value `fire`
 * discards, an asserted absence, or the passage of time.
 */
const MANAGER_EXCLUSIONS = [
  "Reply to a ticket that has files attached",
  "Reply when an agent has replied first",
  "Correct a message I wrote",
  "I cannot correct a message that is not mine",
  "Withdraw a message I wrote",
  "I cannot withdraw a message that is not mine",
  "Download a file from the conversation",
  "Remove a file I attached",
  "Attach a file to what I am about to send",
  "A file larger than the permitted size is refused before upload",
  "A brand that names no permitted kinds permits every kind",
  "An expired session does not lose my upload",
  "I cannot close a locked ticket",
  "Reopen a ticket that was closed",
  "I cannot rename a locked ticket",
  "See what happened to the ticket, in the conversation",
  "New activity on an open ticket reaches me without my asking",
  "A resolved ticket is not watched",
  "A ticket I am not looking at is not watched",
  "Leaving a ticket stops watching it for good"
];

// -----------------------------------------------------------------------------

describe("the ticket manager's picker no longer reads Scenarios (0)", () => {
  it("declares the module the seam reaches, taken from the page's own declaration", () => {
    expect(TRACKED_MODULE).toBe("tickets");
    expect(TRACKED.without).toStrictEqual(["@collection"]);
    expect(isModuleResolved(TRACKED_MODULE)).toBe(true);
  });

  it("binds a composable so the harness can build a boot thunk for this key", () => {
    // The opt-in itself. Without it the key is outside `boundKeys`, and
    // `World.boot("ticket", …)` throws — which is what left every
    // manager scenario spec-only.
    expect(managerScenario.useManage).toBeTypeOf("function");
    // Still self-drawn: the generic renderer is never involved.
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

    expect(names).not.toContain("Page through a long list of my tickets");
    expect(names).not.toContain(
      "Sort my tickets, with the most recently active first by default"
    );
    expect(
      every(playlist().tracks, track => !includes(track.tags, "@collection"))
    ).toBe(true);
  });

  it("carries its OWN lane and nothing else — the split is total", () => {
    // Every driveable tickets scenario belongs to exactly one page: each of the
    // three the feature left untagged turned out to fire a COLLECTION action
    // (`tickets.steps.ts` — `loadDepartmentOptions`, `loadTicketStatuses`,
    // `savePrefs` all live on `useTickets` and nowhere else), so there is
    // no shared scenario to keep. `without` still admits one; none exists here.
    expect(
      every(playlist().tracks, track => includes(track.tags, "@manager"))
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

  it("boots every track at the client scope the page is already on", () => {
    // Actor only, and no context: the ticket id is the URL's
    // (`/useTicket/<id>`) and no catalog can name it, so the page's own world
    // completes the record. A track declaring a context here would make every
    // one of them foreign to the page and send the player navigating away from
    // the ticket on screen.
    expect(
      every(playlist().tracks, track => track.scope?.actor === "client")
    ).toBe(true);
    expect(
      every(playlist().tracks, track => isEmpty(track.scope?.context))
    ).toBe(true);
  });

  it("carries every manager scenario that earned steps", () => {
    const names = map(playlist().tracks, "name");

    expect(
      filter(MANAGER_TRACKS, name => !includes(names, name))
    ).toStrictEqual([]);
  });

  it("carries none that did not — each named in the catalog with its proving spec", () => {
    const names = map(playlist().tracks, "name");

    expect(
      filter(MANAGER_EXCLUSIONS, name => includes(names, name))
    ).toStrictEqual([]);
  });

  it("boots the key THIS page is registered under, never the collection's", () => {
    // The catalog names both keys as literals (headless holds no scenario
    // concept), so this is the one place the two spellings meet.
    expect(stepModules[TRACKED_MODULE!].TICKET_SCENARIO).toBe(
      managerScenario.key
    );
    expect(stepModules[TRACKED_MODULE!].TICKETS_SCENARIO).not.toBe(
      managerScenario.key
    );
  });
});
