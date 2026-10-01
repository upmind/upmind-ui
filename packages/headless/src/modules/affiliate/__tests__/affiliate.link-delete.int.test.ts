// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.link-delete — a client deletes a referral link
 * (@AC12, delete half)
 *
 * ## Job To Be Done
 * Protect that `useAffiliateLinks().remove(id)` sends the delete and
 * refetches the list with the current criteria on success (design.md §8.2),
 * and that a refused delete keeps the row with no links GET (design.md §8.2
 * Failure surface).
 *
 * ## Real captures used (affiliate.fixtures.ts)
 * `delete-accounts-id-affiliate-links-id` (200, the real delete of the
 * generator's own throwaway link — already applied server-side, replayed
 * here) and `delete-accounts-id-affiliate-links-id-case-rejected` (404,
 * "Affiliate Account Link not found!", a delete of an unknown id).
 *
 * Stated omissions (ADR-021, design.md §8.2): the 404 case below is this
 * spec's only failure branch; the 5xx case takes the same error-state path
 * per note 3, unexercised here to avoid re-proving the identical branch.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinks } from "../useAffiliateLinks";
import { serveCapture, seedRealClient } from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

// The throwaway link's id is fresh on every re-record (the generator
// creates then deletes a new one each run) — read it from the same
// one-link-read capture the edit/delete specs share, rather than a literal
// that goes stale on the next recording pass.
const THROWAWAY_LINK_ID = recorded<{ data?: { id?: string } }>(
  "get-accounts-id-affiliate-links-id"
).data?.id as string;
const LINK_ROUTE = "*/api/accounts/:accountId/affiliate/links/:linkId";

describe("affiliate.link-delete — a client deletes a referral link", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("a client deletes a referral link, and the list refetches with the current criteria", async () => {
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();
    // A real filter, so "with the current criteria" is provable — the
    // refetch must carry it, not the schema defaults (bdd.md AC12).
    links
      .useActions()
      .setCriteria({ filters: { name: { like: "Affiliate" } } });

    const seenLinkGets: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (
        request.method === "GET" &&
        url.pathname.endsWith("/affiliate/links")
      ) {
        seenLinkGets.push(`${url.pathname}${url.search}`);
      }
    });

    await links.useActions().remove(THROWAWAY_LINK_ID);

    expect(links.useMeta().hasError.value).toBe(false);
    expect(seenLinkGets.length).toBeGreaterThan(0);
    expect(seenLinkGets[0]).toContain("filter");
    expect(seenLinkGets[0]).toContain("Affiliate");
  });

  it("a delete of an unknown link id is refused, and the row stays with no links GET", async () => {
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
    serveCapture(
      "delete",
      LINK_ROUTE,
      "delete-accounts-id-affiliate-links-id-case-rejected"
    );

    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    // Pin the collection's loaded rows before the refused delete and
    // compare, so a mutant that optimistically empties or mutates the
    // collection on any `remove` call reddens.
    const beforeRows = links.useContext().data.value;

    const seenLinkGets: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (
        request.method === "GET" &&
        url.pathname.endsWith("/affiliate/links")
      ) {
        seenLinkGets.push(url.pathname);
      }
    });

    await links.useActions().remove("00000000-0000-0000-0000-000000000000");

    // Real, recorded 404 "Affiliate Account Link not found!".
    expect(links.useMeta().hasError.value).toBe(true);
    expect(JSON.stringify(links.useContext().error.value)).toContain(
      "Affiliate Account Link not found"
    );
    expect(seenLinkGets).toHaveLength(0);
    expect(links.useContext().data.value).toEqual(beforeRows);
  });
});
