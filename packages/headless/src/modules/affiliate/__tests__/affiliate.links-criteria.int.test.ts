// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.links-criteria — a filter or a sort write on the
 * links listing reaches the wire (@AC8, the filter/sort half of the AC7-AC9
 * bundle `affiliate.links-list.int.test.ts` names as its own named gap)
 *
 * ## Job To Be Done
 * Protect that `useAffiliateLinks().setCriteria(...)` puts the declared
 * filter and sort branch on the wire (design.md §8.3), against this unit's
 * one real recorded link — a filter or sort write cannot change WHICH rows
 * the replay pool serves (only one capture exists for this route, and the
 * replay pool falls back to it for any unmatched query string, design.md
 * §8.9 "Unmatched query strings"), so this spec reads the outbound request,
 * not a changed response, exactly as design.md §8.9 requires ("A spec that
 * asserts a filter key reads the outbound-request observer, not a
 * response").
 *
 * ## What Breaks If These Fail
 * A client narrowing or reordering their referral links would see the
 * request silently drop the filter or sort branch, and the API would answer
 * with the unfiltered, default-ordered list instead.
 *
 * ## Capture gap (G3, honestly disclosed)
 * Pagination (AC9) stays `@todo` in `affiliate.feature` — this account
 * carries exactly one real link, so no real page boundary exists to prove
 * against (`affiliate.links-list.int.test.ts`'s own header).
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinks } from "../useAffiliateLinks";
import { recordedAccountId, seedRealClient } from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";
import type { SortDirection } from "../../query/query.types";

// -----------------------------------------------------------------------------

type LinksBody = { data?: { id?: string }[] };

function recordedLinkId(): string {
  const id = recorded<LinksBody>(
    "get-accounts-id-affiliate-links-with-staged-imports-1"
  ).data?.[0]?.id;
  if (!id)
    throw new Error(
      "[affiliate.links-criteria] recorded links capture carries no row id."
    );
  return id;
}

describe("affiliate.links-criteria — a filter or a sort write reaches the wire", () => {
  beforeEach(async () => {
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
  });

  it("a name-equals filter write carries the declared operator branch on the wire, and the recorded row still comes back", async () => {
    const accountId = recordedAccountId();
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/links")) seen.push(url);
    });

    links.useActions().setCriteria({
      filters: { name: { eq: "Affiliate Starter Hosting" } }
    });

    // `request:end` — the response has landed, not merely been dispatched —
    // before the outbound-request and row assertions below trust it.
    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await links.useActions().isReady();

    expect(seen[0].pathname).toBe(`/api/accounts/${accountId}/affiliate/links`);
    // Exact param, exactly once — a stray or duplicated param reddens, unlike
    // a substring check on the raw query string.
    expect(seen[0].searchParams.getAll("filter[name|eq]")).toEqual([
      "Affiliate Starter Hosting"
    ]);

    // Characterisation, not a discriminating control: only one real row
    // exists for this route, and the replay pool serves it for any
    // unmatched query string (design.md §8.9), so this pins that the row
    // read still resolves after the write — it cannot tell a fresh
    // filtered response apart from the stale first-load response. A
    // discriminating row check needs a second real row this account does
    // not have.
    const rows = links.useContext().data.value;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(recordedLinkId());
  });

  it("a sort write carries the declared field and direction on the wire, and the recorded row still comes back", async () => {
    const accountId = recordedAccountId();
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/links")) seen.push(url);
    });

    links.useActions().setCriteria({
      sort: [{ field: "visit_count", dir: "desc" as SortDirection }]
    });

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await links.useActions().isReady();

    expect(seen[0].pathname).toBe(`/api/accounts/${accountId}/affiliate/links`);
    // `desc`, not `asc` — a mutant that drops the direction still produces
    // `order=visit_count`, so only the `-` prefix pins the direction itself.
    expect(seen[0].searchParams.getAll("order")).toEqual(["-visit_count"]);

    // Characterisation, not a discriminating control — see the filter case
    // above: one real row, served for any query string, so this pins that
    // the row read still resolves after the write, not that the sort
    // actually reordered a second row this account does not have.
    const rows = links.useContext().data.value;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(recordedLinkId());
  });

  it("a visit_count equals filter write carries its own operator branch on the wire, not a bare literal (design.md §8.3)", async () => {
    const accountId = recordedAccountId();
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/links")) seen.push(url);
    });

    links.useActions().setCriteria({
      filters: { visit_count: { eq: 3 } }
    });

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await links.useActions().isReady();

    expect(seen[0].pathname).toBe(`/api/accounts/${accountId}/affiliate/links`);
    // A bare-number column (design.md §8.11 `bare-visit-count`) would send
    // `filter[visit_count]=3`, with no `|eq` operator segment at all.
    expect(seen[0].searchParams.getAll("filter[visit_count|eq]")).toEqual([
      "3"
    ]);
    expect(seen[0].searchParams.getAll("filter[visit_count]")).toEqual([]);
  });

  // The paging EDGE (a written page boundary returning a DIFFERENT row) stays
  // `@todo` in `affiliate.feature` (AC9, DV3/DV4) — this account carries
  // exactly one real link (`total: 1` on the recorded capture), so there is
  // no in-bounds non-zero offset to write: `offset: 1` would exceed the one
  // real row and trigger the query core's own last-page recovery (the
  // dropped P43 divergence, query core off limits), not this module's own
  // pagination-write logic. Only the explicit LIMIT write is proven below —
  // the OFFSET half is a named gap, not proven, because `offset: 0` is the
  // schema's own default and a dropped-offset mutant would not redden it.
  it("a page-size write carries the explicit limit param on the outbound request (the offset half is a named gap — one real row, no in-bounds non-zero offset), and the recorded row still comes back", async () => {
    const accountId = recordedAccountId();
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/links")) seen.push(url);
    });

    links.useActions().setCriteria({ pagination: { limit: 20, offset: 0 } });

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await links.useActions().isReady();

    expect(seen[0].pathname).toBe(`/api/accounts/${accountId}/affiliate/links`);
    expect(seen[0].searchParams.getAll("limit")).toEqual(["20"]);
    // Named gap, not a proof: `offset: 0` is the schema's own default, so
    // this line only documents the wire shape — it cannot discriminate a
    // mutant that drops the offset write (see the file header above).
    expect(seen[0].searchParams.getAll("offset")).toEqual(["0"]);

    // Characterisation, not a discriminating control — see the filter case
    // above.
    const rows = links.useContext().data.value;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(recordedLinkId());
  });
});
