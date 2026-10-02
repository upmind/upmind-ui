// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.commissions-criteria — a filter or a sort write on
 * the pending-commissions listing reaches the wire (@AC17, the filter/sort
 * half of the AC16/AC17 bundle `affiliate.commissions-list.int.test.ts`
 * names as its own named gap)
 *
 * ## Job To Be Done
 * Protect that `useAffiliateCommissions().setCriteria(...)` puts the
 * declared filter and sort branch on the wire (design.md §8.3), including
 * `amount` as a real sortable field the schema declares alongside
 * `created_at`. Under ADR-035 strict replay each filter query string is
 * served its OWN verbatim recording (no base-capture fallback); this account
 * carries too few rows for a filter or sort write to reorder the result, so
 * the discriminating proof is the outbound-request observer, not a changed
 * response. The listing also publishes a criteria uischema whose controls
 * address its own criteria schema, including the `created_at` filter.
 *
 * ## What Breaks If These Fail
 * A client narrowing or reordering their commission history by date or
 * amount would see the request silently drop the filter or sort branch, or a
 * filter bar would have no control to draw.
 *
 * ## Capture gap (G3, honestly disclosed)
 * Pagination (AC17) stays `@todo` in `affiliate.feature` — this account
 * carries exactly 2 real rows, no real page boundary to prove against
 * (`affiliate.commissions-list.int.test.ts`'s own header).
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateCommissions } from "../useAffiliateCommissions";
import { recordedAccountId, seedRealClient } from "./affiliate.int-helpers";
import {
  controlScopePaths,
  resolvesInSchema,
  type UischemaNode
} from "./affiliate.uischema-helpers";
import { recorded, server } from "./setup.integration";
import type { SortDirection } from "../../query/query.types";

// -----------------------------------------------------------------------------

type CommissionsBody = { data?: { id?: string }[] };

function recordedCommissionIds(
  capture = "get-accounts-id-affiliate-pending-commissions-with-staged-imports-1"
): (string | undefined)[] {
  return (recorded<CommissionsBody>(capture).data ?? []).map(r => r.id);
}

describe("affiliate.commissions-criteria — a filter or a sort write reaches the wire", () => {
  beforeEach(async () => {
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
  });

  it("a created_at 'after' filter write carries the declared operator branch on the wire, and the recorded rows still come back", async () => {
    const accountId = recordedAccountId();
    const commissions = useAffiliateCommissions().as(ScopeActorTypes.CLIENT);
    await commissions.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/pending_commissions"))
        seen.push(url);
    });

    commissions.useActions().setCriteria({
      filters: { created_at: { after: "-1_months" } }
    });

    // `request:end` — the response has landed, not merely been dispatched —
    // before the outbound-request and row assertions below trust it.
    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await commissions.useActions().isReady();

    expect(seen[0].pathname).toBe(
      `/api/accounts/${accountId}/affiliate/pending_commissions`
    );
    expect(seen[0].searchParams.getAll("filter[created_at|after]")).toEqual([
      "-1_months"
    ]);

    // Row ids read from THIS filtered request's OWN recording (ADR-035 strict
    // replay — each query string is served its own verbatim capture, no base
    // fallback). Characterisation, not the discriminating half: it proves the
    // filtered rows flow through to context, while the request-observer
    // assertion above is what pins the filter branch itself.
    const rows = commissions.useContext().data.value;
    expect(rows.map(r => r.id)).toEqual(
      recordedCommissionIds(
        "get-accounts-id-affiliate-pending-commissions-filter-created-at-after-1-months-with-staged-imports-1"
      )
    );
  });

  it("an amount sort write carries the declared field and direction on the wire, and the recorded rows still come back", async () => {
    const accountId = recordedAccountId();
    const commissions = useAffiliateCommissions().as(ScopeActorTypes.CLIENT);
    await commissions.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/pending_commissions"))
        seen.push(url);
    });

    commissions.useActions().setCriteria({
      sort: [{ field: "amount", dir: "desc" as SortDirection }]
    });

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await commissions.useActions().isReady();

    expect(seen[0].pathname).toBe(
      `/api/accounts/${accountId}/affiliate/pending_commissions`
    );
    expect(seen[0].searchParams.getAll("order")).toEqual(["-amount"]);

    // Characterisation, not a discriminating control: `order` is not part of
    // the replay identity (fixture-handlers.ts), so a sort write is served the
    // base list capture — this pins the row read still resolves after the
    // write, not that the sort reordered the rows.
    const rows = commissions.useContext().data.value;
    expect(rows.map(r => r.id)).toEqual(recordedCommissionIds());
  });

  // The paging EDGE (a written page boundary returning a DIFFERENT row) stays
  // `@todo` in `affiliate.feature` (AC17, DV3/DV4) — this account carries
  // exactly 2 real rows (`total: 2` on the recorded capture), no real page
  // boundary to prove against. `offset: 1` stays in bounds (2 real rows), so
  // BOTH the explicit LIMIT write and the explicit, non-default, in-bounds
  // OFFSET write are proven here — an `offset: 0` write is the schema's own
  // default and cannot discriminate a dropped-offset mutant (CONTROLS.md).
  it("a page-size and offset write carries both params on the outbound request, and the recorded rows still come back", async () => {
    const accountId = recordedAccountId();
    const commissions = useAffiliateCommissions().as(ScopeActorTypes.CLIENT);
    await commissions.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/pending_commissions"))
        seen.push(url);
    });

    commissions
      .useActions()
      .setCriteria({ pagination: { limit: 1, offset: 1 } });

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await commissions.useActions().isReady();

    expect(seen[0].pathname).toBe(
      `/api/accounts/${accountId}/affiliate/pending_commissions`
    );
    expect(seen[0].searchParams.getAll("limit")).toEqual(["1"]);
    expect(seen[0].searchParams.getAll("offset")).toEqual(["1"]);

    const rows = commissions.useContext().data.value;
    expect(rows.map(r => r.id)).toEqual(recordedCommissionIds());
  });

  it("the commission history publishes a criteria form that filters by creation date over its own criteria", async () => {
    const commissions = useAffiliateCommissions().as(ScopeActorTypes.CLIENT);
    await commissions.useActions().isReady();

    const { schema, uischema } = commissions.useContext().schemas.query;
    const paths = controlScopePaths(uischema as UischemaNode);

    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(resolvesInSchema(schema, path), path.join(".")).toBe(true);
    }
    expect(
      paths.some(path => path[0] === "filters" && path[1] === "created_at"),
      paths.map(path => path.join(".")).join(" | ")
    ).toBe(true);
  });
});
