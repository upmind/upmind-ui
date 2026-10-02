// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.referrals-criteria — a filter or a sort write on
 * the referrals listing reaches the wire (@AC15, the filter/sort half of the
 * AC14/AC15 bundle `affiliate.referrals-list.int.test.ts` names as its own
 * named gap)
 *
 * ## Job To Be Done
 * Protect that `useAffiliateReferrals().setCriteria(...)` puts the declared
 * filter and sort branch on the wire, including the dotted `affiliate_link.*`
 * schema keys, which stay LITERAL on the wire and are never split into a
 * nested path (design.md §8.3, audit DI-6). Under ADR-035 strict replay each
 * filter query string is served its OWN verbatim recording (no base-capture
 * fallback); the discriminating proof is the outbound-request observer, and
 * the row read checks the composable surfaces exactly that filtered
 * recording's rows.
 *
 * ## What Breaks If These Fail
 * A client narrowing or reordering their referrals would see the request
 * silently drop the filter or sort branch, or a dotted key would get split
 * into a nested path the query core then rejects (the landed
 * `useValidation.dotted-key-path-split` regression this module's own
 * negative-control table reuses, design.md §8.11).
 *
 * ## Capture gap (G3, honestly disclosed)
 * Pagination (AC15) stays `@todo` in `affiliate.feature` — this account
 * carries exactly 3 real rows against a default page size of 5, so no real
 * page boundary exists to prove against
 * (`affiliate.referrals-list.int.test.ts`'s own header).
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateReferrals } from "../useAffiliateReferrals";
import { recordedAccountId, seedRealClient } from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";
import type { SortDirection } from "../../query/query.types";

// -----------------------------------------------------------------------------

type ReferralsBody = { data?: { id?: string }[] };

function recordedReferralIds(
  capture = "get-accounts-id-affiliate-referrals"
): (string | undefined)[] {
  return (recorded<ReferralsBody>(capture).data ?? []).map(r => r.id);
}

describe("affiliate.referrals-criteria — a filter or a sort write reaches the wire", () => {
  beforeEach(async () => {
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
  });

  it("a dotted affiliate_link.name filter write stays literal on the wire, and the recorded rows still come back", async () => {
    const accountId = recordedAccountId();
    const referrals = useAffiliateReferrals().as(ScopeActorTypes.CLIENT);
    await referrals.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/referrals")) seen.push(url);
    });

    referrals.useActions().setCriteria({
      filters: { "affiliate_link.name": { eq: "Affiliate Starter Hosting" } }
    });

    // `request:end` — the response has landed, not merely been dispatched —
    // before the outbound-request and row assertions below trust it.
    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await referrals.useActions().isReady();

    expect(seen[0].pathname).toBe(
      `/api/accounts/${accountId}/affiliate/referrals`
    );
    // Exact param, exactly once, the dotted key stays literal (never split
    // into a nested path) — a stray or duplicated param reddens too.
    expect(
      seen[0].searchParams.getAll("filter[affiliate_link.name|eq]")
    ).toEqual(["Affiliate Starter Hosting"]);

    // Row ids read from THIS filtered request's OWN recording (ADR-035 strict
    // replay — each query string is served its own verbatim capture, no base
    // fallback). None of this account's referrals came through a link named
    // "Affiliate Starter Hosting", so the real filtered recording holds zero
    // rows: this pins that the composable surfaces exactly the filtered
    // result — the empty set here — through to context, while the
    // request-observer assertion above pins the dotted-filter branch itself.
    const rows = referrals.useContext().data.value;
    expect(rows.map(r => r.id)).toEqual(
      recordedReferralIds(
        "get-accounts-id-affiliate-referrals-filter-affiliate-link-name-eq-affiliate-starter-hosting"
      )
    );
  });

  it("a sort write carries the declared field and direction on the wire, and the recorded rows still come back", async () => {
    const accountId = recordedAccountId();
    const referrals = useAffiliateReferrals().as(ScopeActorTypes.CLIENT);
    await referrals.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/referrals")) seen.push(url);
    });

    // Named gap: `created_at` is the referrals schema's only sortable field
    // (design.md §8.3), and `AFFILIATE_DEFAULT_SORT` is already
    // `created_at desc` (design.md §5.2). Writing `desc` again is a no-op
    // key with no second request to assert on, so this spec can only write
    // `asc` (a real change from the default) and pin the FIELD with no `-`
    // direction prefix — it cannot also pin the reverse write's `-` prefix,
    // unlike links/commissions/payouts (each with a second sortable field).
    // `affiliate.feature` names this gap.
    referrals.useActions().setCriteria({
      sort: [{ field: "created_at", dir: "asc" as SortDirection }]
    });

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await referrals.useActions().isReady();

    expect(seen[0].pathname).toBe(
      `/api/accounts/${accountId}/affiliate/referrals`
    );
    expect(seen[0].searchParams.getAll("order")).toEqual(["created_at"]);

    // Characterisation, not a discriminating control: `order` is not part of
    // the replay identity (fixture-handlers.ts), so a sort write is served the
    // base list capture — this pins the row read still resolves after the
    // write, not that the sort reordered the rows.
    const rows = referrals.useContext().data.value;
    expect(rows.map(r => r.id)).toEqual(recordedReferralIds());
  });

  // The paging EDGE (a written page boundary returning a DIFFERENT row) stays
  // `@todo` in `affiliate.feature` (AC15, DV3/DV4) — this account carries
  // exactly 3 real rows against a default page size of 5 (`total: 3` on the
  // recorded capture), no real page boundary to prove against. `offset: 1`
  // stays in bounds (3 real rows), so BOTH the explicit LIMIT write and the
  // explicit, non-default, in-bounds OFFSET write are proven here — an
  // `offset: 0` write is the schema's own default and cannot discriminate a
  // dropped-offset mutant (CONTROLS.md).
  it("a page-size and offset write carries both params on the outbound request, and the recorded rows still come back", async () => {
    const accountId = recordedAccountId();
    const referrals = useAffiliateReferrals().as(ScopeActorTypes.CLIENT);
    await referrals.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/referrals")) seen.push(url);
    });

    referrals.useActions().setCriteria({ pagination: { limit: 1, offset: 1 } });

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await referrals.useActions().isReady();

    expect(seen[0].pathname).toBe(
      `/api/accounts/${accountId}/affiliate/referrals`
    );
    expect(seen[0].searchParams.getAll("limit")).toEqual(["1"]);
    expect(seen[0].searchParams.getAll("offset")).toEqual(["1"]);

    const rows = referrals.useContext().data.value;
    expect(rows.map(r => r.id)).toEqual(recordedReferralIds());
  });
});
