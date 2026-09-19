// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The manager page draws its OWN scenario bar (FE-3226)
 *
 * ## Job To Be Done
 * `feature-tracks.client-ticket.spec.ts` proves the PLAYLIST resolves — that
 * asking the seam for the module this declaration tracks yields tracks whose
 * every scene the module's own catalog matches. It cannot prove the page draws
 * them: a playlist nothing mounts is the state this page was already in, and it
 * looks identical from the outside, because Live-only is legitimate (`S12`).
 *
 * So this mounts the REAL manager page, on the real deep link, behind the real
 * registrar route and scope middleware, and reads the bar off the rendered
 * tree: the transport is there, and the picker it draws carries the module's
 * whole driveable playlist rather than the nothing it carried before.
 *
 * The count is COMPUTED from the same seam the page reads, never a literal: a
 * scenario earning steps later moves both sides together, which is the point —
 * what is graded is that the page draws what the module has, not that it draws
 * some particular number.
 *
 * ## What Breaks If These Fail
 * The manager page silently loses its transport and every scenario the module
 * proves goes back to being unplayable from the page that owns them — with no
 * error anywhere.
 *
 * ## Provenance
 * Bodies are COMMITTED `tickets` / `session-store` captures replayed over MSW,
 * through the same bench the rest of this page's read-backs use.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { featureTracksFor } from "../runtime/force/corpus.source";
import { excludedTagsOf, trackedModuleOf } from "../runtime/scenario.utils";
import managerScenario from "../useClientTicket/client-ticket.scenario";
import {
  installTicketsHandlers,
  mountTicketPage,
  seedClientSession,
  teardownSession,
  testKey,
  unmountTicketPage
} from "./client-ticket-page.harness";
import { filter, intersection, isEmpty, size } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const SETTLE = 10000;

/**
 * What the page SHOULD be able to draw, computed off the same committed
 * artefacts it reads — the module's driveable subset (ADR-020 Amendment 5),
 * through the harness's own parser and matcher.
 *
 * MINUS the lane this page does not play. `tickets` is the first module whose
 * one feature serves two pages, so the manager's bar offers the manager's
 * scenarios and the shared ones, never the collection's paging and sorting
 * (`ScenarioTracks.without`). Both halves are read off the declaration, so the
 * oracle follows a page that changes lanes rather than pinning a number.
 */
function driveableCount(): number {
  const source = featureTracksFor(trackedModuleOf(managerScenario.tracks)!)!;
  const excluded = excludedTagsOf(managerScenario.tracks);

  return size(
    filter(
      createTraceabilityCheck(source.feature, source.catalog, {}).driveable,
      scenario => isEmpty(intersection(scenario.tags, excluded))
    )
  );
}

// -----------------------------------------------------------------------------

describe("the client-ticket manager page mounts its own scenario bar", () => {
  beforeEach(async () => {
    await seedClientSession();
    installTicketsHandlers();
  });

  afterEach(() => {
    unmountTicketPage();
    teardownSession();
  });

  it(
    "draws the bar on the ticket it was deep-linked to",
    async () => {
      const wrapper: VueWrapper = await mountTicketPage();

      await vi.waitFor(
        () => expect(testKey(wrapper, "ticket-reference").exists()).toBe(true),
        { timeout: SETTLE }
      );

      expect(testKey(wrapper, "scenario-bar").exists()).toBe(true);
    },
    SETTLE + 5000
  );

  it(
    "offers the module's whole driveable playlist, not an empty picker",
    async () => {
      const wrapper: VueWrapper = await mountTicketPage();

      await vi.waitFor(
        () => expect(testKey(wrapper, "scenario-menu").exists()).toBe(true),
        { timeout: SETTLE }
      );

      const offered = Number(
        testKey(wrapper, "scenario-menu").attributes("data-test-value")
      );

      expect(offered).toBe(driveableCount());
      expect(offered).toBeGreaterThan(0);
    },
    SETTLE + 5000
  );

  it(
    "leaves the page LIVE with its own controls in the operator's hands",
    async () => {
      // No track armed and no forced state, so nothing is locked: the scrim the
      // bar's own lock draws must be absent, or the page would ship unusable.
      const wrapper: VueWrapper = await mountTicketPage();

      await vi.waitFor(
        () => expect(testKey(wrapper, "ticket-reference").exists()).toBe(true),
        { timeout: SETTLE }
      );

      expect(testKey(wrapper, "replay-scrim").exists()).toBe(false);
    },
    SETTLE + 5000
  );
});
