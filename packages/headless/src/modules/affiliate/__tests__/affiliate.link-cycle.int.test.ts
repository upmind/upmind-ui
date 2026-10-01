// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.link-cycle — a client creates, edits and deletes
 * the SAME referral link in one continuous cycle (@AC10, @AC11)
 *
 * ## Job To Be Done
 * Protect the Gherkin promise `affiliate.feature` makes for "A client
 * creates, edits and deletes a referral link": ONE link, created, then
 * edited, then deleted — not three independently-provable legs each on
 * their own id (pseudo-Nathan review, cardinal call 3: "no single test
 * chains create → edit → delete on the same link"). `affiliate.link-create`,
 * `affiliate.link-edit` and `affiliate.link-delete` each already prove their
 * own leg's failure branches and each already read the SAME real throwaway
 * link id back from their own captures — this spec is the first to CHAIN
 * them through one real id, carried forward from the create response into
 * the edit open and the delete call, never a hand-picked literal.
 *
 * ## What Breaks If These Fail
 * A client who creates a link, edits it, then deletes it would be silently
 * acting on a DIFFERENT link at one of the three steps (a stale id, a
 * dropped id, or a mismatched manager instance), with no observable error.
 *
 * ## Real captures used (affiliate.fixtures.ts — the SAME throwaway link,
 * created, read, edited, then deleted by the generator itself, in that
 * order)
 * `post-accounts-id-affiliate-links` (the create), `get-accounts-id-affiliate-links-id`
 * (the one-link read the edit-open seeds from), `put-accounts-id-affiliate-links-id`
 * (the edit) and `delete-accounts-id-affiliate-links-id` (the delete) — all
 * four carry the identical real link id, confirmed by reading each capture's
 * own body rather than asserting on a hand-typed id.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no refused
 * request of its own — `affiliate.link-create/-edit/-delete.int.test.ts`
 * each already own the 422/404 failure branch for their own leg.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { useAffiliateLinks } from "../useAffiliateLinks";
import { inputAndSettle, seedRealClient } from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

type LinkBody = {
  data?: { id?: string; name?: string; redirect_url?: string };
};

describe("affiliate.link-cycle — a client creates, edits and deletes the SAME referral link", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("A client creates, edits and deletes a referral link", async () => {
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const createdLink = recorded<LinkBody>(
      "post-accounts-id-affiliate-links"
    ).data;
    const editedLink = recorded<LinkBody>(
      "put-accounts-id-affiliate-links-id"
    ).data;

    const seenPosts: string[] = [];
    const seenPuts: string[] = [];
    const seenDeletes: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (
        request.method === "POST" &&
        url.pathname.endsWith("/affiliate/links")
      )
        seenPosts.push(url.pathname);
      if (request.method === "PUT" && /\/links\/[^/]+$/.test(url.pathname))
        seenPuts.push(url.pathname);
      if (request.method === "DELETE" && /\/links\/[^/]+$/.test(url.pathname))
        seenDeletes.push(url.pathname);
    });

    // --- create ---------------------------------------------------------
    const createManager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    let createdId: string;
    try {
      await createManager.useActions().isReady();
      await inputAndSettle(createManager, {
        name: createdLink?.name ?? "",
        redirectUrl: createdLink?.redirect_url ?? ""
      });

      await createManager.useActions().update();

      expect(createManager.useMeta().hasError.value).toBe(false);
      expect(createManager.useContext().id.value).toBe(createdLink?.id);
      createdId = createManager.useContext().id.value as string;
    } finally {
      createManager.useActions().destroy();
    }

    // --- edit, the SAME id the create step just adopted -----------------
    const editManager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .withId(createdId);
    try {
      await editManager.useActions().isReady();

      expect(editManager.useContext().id.value).toBe(createdId);
      expect(editManager.useContext().model.value?.name).toBe(
        createdLink?.name
      );

      await inputAndSettle(editManager, {
        name: editedLink?.name ?? "",
        redirectUrl: editedLink?.redirect_url ?? ""
      });

      await editManager.useActions().update();

      expect(editManager.useMeta().hasError.value).toBe(false);
      expect(editManager.useContext().model.value?.name).toBe(editedLink?.name);
    } finally {
      editManager.useActions().destroy();
    }

    // --- delete, the SAME id again ---------------------------------------
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    await links.useActions().remove(createdId);

    expect(links.useMeta().hasError.value).toBe(false);
    expect(seenPosts).toHaveLength(1);
    expect(seenPuts.some(url => url.endsWith(`/links/${createdId}`))).toBe(
      true
    );
    expect(seenDeletes.some(url => url.endsWith(`/links/${createdId}`))).toBe(
      true
    );
  });
});
