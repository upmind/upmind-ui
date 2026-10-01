// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.link-edit — a client edits a referral link
 * (@AC11, edit half)
 *
 * ## Job To Be Done
 * Protect that `useAffiliateLinkManager().as(CLIENT).withId(linkId)` loads
 * the one link, saves it, and refreshes the links collection after a
 * successful save (design.md §8.6: "After `update`, the manager invalidates
 * each links key of the pinned account... refetches also when no listing
 * observes it"). Also protects the refused-edit failure path (design.md
 * §8.2 Failure surface).
 *
 * ## Real captures used (affiliate.fixtures.ts — a throwaway link, created
 * then deleted by the generator itself)
 * `get-accounts-id-affiliate-links-id` (the one-link read), followed by
 * `put-accounts-id-affiliate-links-id` (200, the real edit) or
 * `put-accounts-id-affiliate-links-id-case-rejected` (422, empty fields).
 * This spec sends the SAME field values the generator sent.
 *
 * Stated omissions (ADR-021, design.md §8.2): the 422 case below is this
 * spec's only failure branch, and the one-link-read failure (a 500 override)
 * is not authored this pass — a named authoring gap.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { useAffiliateLinks } from "../useAffiliateLinks";
import {
  inputAndSettle,
  seedRealClient,
  serveCapture
} from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

type LinkBody = {
  data?: { id?: string; name?: string; redirect_url?: string };
};

// The throwaway link's id/name/redirect_url are fresh on every re-record
// (the generator creates then deletes a new one each run) — read them from
// the same one-link-read capture the manager's own GET replays, rather than
// a literal that goes stale on the next recording pass.
const ORIGINAL_LINK = recorded<LinkBody>(
  "get-accounts-id-affiliate-links-id"
).data;
const THROWAWAY_LINK_ID = ORIGINAL_LINK?.id as string;
// The edited name/redirect_url the generator actually PUT — read from the
// real edit-success response, never re-typed by hand.
const EDITED_LINK = recorded<LinkBody>(
  "put-accounts-id-affiliate-links-id"
).data;
const LINK_ROUTE = "*/api/accounts/:accountId/affiliate/links/:linkId";

describe("affiliate.link-edit — a client edits a referral link", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("a client edits a referral link, and the links collection refreshes after the save", async () => {
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    const seenLinkGets: string[] = [];
    const seenPutBodies: string[] = [];
    server?.events.on("request:start", async ({ request }) => {
      const url = new URL(request.url);
      if (
        request.method === "GET" &&
        url.pathname.endsWith("/affiliate/links")
      ) {
        seenLinkGets.push(url.pathname);
      }
      if (
        request.method === "PUT" &&
        url.pathname.endsWith(`/links/${THROWAWAY_LINK_ID}`)
      ) {
        seenPutBodies.push(await request.clone().text());
      }
    });

    const manager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .withId(THROWAWAY_LINK_ID);
    try {
      await manager.useActions().isReady();

      expect(manager.useContext().model.value?.name).toBe(ORIGINAL_LINK?.name);

      await inputAndSettle(manager, {
        name: EDITED_LINK?.name ?? "",
        redirectUrl: EDITED_LINK?.redirect_url ?? ""
      });

      await manager.useActions().update();

      expect(manager.useMeta().hasError.value).toBe(false);
      expect(manager.useContext().model.value?.name).toBe(EDITED_LINK?.name);

      // The invalidate + refetchType "all" (design.md §8.6) sends a links GET
      // after the save with no listing observer required — this reddens under
      // the `no-edit-refresh` mutant of design.md §8.11.
      expect(seenLinkGets.length).toBeGreaterThan(0);

      // The PUT payload itself must carry the edit, not merely a count of
      // the outbound call.
      expect(seenPutBodies).toHaveLength(1);
      expect(seenPutBodies[0]).toContain(EDITED_LINK?.name as string);
      expect(seenPutBodies[0]).toContain(
        (EDITED_LINK?.redirect_url as string).split("/").pop() as string
      );
    } finally {
      manager.useActions().destroy();
    }
  });

  it("an edit with an empty redirect_url is refused, and fills errors", async () => {
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const manager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .withId(THROWAWAY_LINK_ID);
    try {
      await manager.useActions().isReady();

      await inputAndSettle(manager, { name: "", redirectUrl: "" });

      // The recorded rejected-case capture is keyed `case=rejected` on the
      // wire (the generator's own variant-selection convention) — the real
      // production PUT never sends that param, so the replay pool cannot
      // reach it by body content alone; serve it explicitly.
      serveCapture(
        "put",
        LINK_ROUTE,
        "put-accounts-id-affiliate-links-id-case-rejected"
      );

      await manager.useActions().update();

      // Real, recorded 422 — pin the wire's own field message exactly (not a
      // substring), so a truncated or wrong message stays red.
      //
      // Capture gap, honestly disclosed: `errors.value` is a flat string
      // here (not a `Record<field, string[]>`), and this capture carries
      // exactly one field (`redirect_url`) — a mutant that reads ANY
      // field's message with no real per-key lookup would still pass this
      // assertion, because no second field exists in the recorded 422 to
      // discriminate a wrong key against. Not fixable without a capture
      // this brand never produced.
      expect(manager.useMeta().hasError.value).toBe(true);
      expect(manager.useContext().errors.value).toBe(
        "Redirect url must be a valid URL"
      );
    } finally {
      manager.useActions().destroy();
    }
  });
});
