// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.payouts-criteria — a filter or a sort write on the
 * payouts listing reaches the wire (@AC21, the filter/sort half of the
 * AC20/AC21 bundle `affiliate.payouts-list.int.test.ts` names as its own
 * named gap)
 *
 * ## Job To Be Done
 * Protect that `useAffiliatePayouts().setCriteria(...)` puts the declared
 * filter and sort branch on the wire (design.md §8.3), including `amount` as
 * a real sortable field the schema declares alongside `created_at`. Under
 * ADR-035 strict replay each filter query string is served its OWN verbatim
 * recording (no base-capture fallback); this account carries a single payout,
 * so a filter or sort write cannot reorder the result, and the discriminating
 * proof is the outbound-request observer, not a changed response. The
 * listing also publishes a criteria uischema whose controls address its own
 * criteria schema, including the `created_at` filter.
 *
 * ## What Breaks If These Fail
 * A client narrowing or reordering their payout history by date or amount
 * would see the request silently drop the filter or sort branch, or a filter
 * bar would have no control to draw.
 *
 * ## Capture gap (G3, honestly disclosed)
 * Pagination (AC21) stays `@todo` in `affiliate.feature` — this account
 * carries exactly 1 real row, no real page boundary to prove against
 * (`affiliate.payouts-list.int.test.ts`'s own header).
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliatePayouts } from "../useAffiliatePayouts";
import { recordedAccountId, seedRealClient } from "./affiliate.int-helpers";
import {
  controlScopePaths,
  resolvesInSchema,
  type UischemaNode
} from "./affiliate.uischema-helpers";
import { recorded, server } from "./setup.integration";
import type { SortDirection } from "../../query/query.types";

// -----------------------------------------------------------------------------

type PayoutsBody = { data?: { id?: string }[] };

function recordedPayoutId(
  capture = "get-accounts-id-affiliate-payouts-with-staged-imports-1"
): string {
  const id = recorded<PayoutsBody>(capture).data?.[0]?.id;
  if (!id)
    throw new Error(
      `[affiliate.payouts-criteria] recorded payouts capture "${capture}" carries no row id.`
    );
  return id;
}

describe("affiliate.payouts-criteria — a filter or a sort write reaches the wire", () => {
  beforeEach(async () => {
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
  });

  it("a created_at 'before' filter write carries the declared operator branch on the wire, and the recorded row still comes back", async () => {
    const accountId = recordedAccountId();
    const payouts = useAffiliatePayouts().as(ScopeActorTypes.CLIENT);
    await payouts.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/payouts")) seen.push(url);
    });

    payouts.useActions().setCriteria({
      filters: { created_at: { before: "1_days" } }
    });

    // `request:end` — the response has landed, not merely been dispatched —
    // before the outbound-request and row assertions below trust it.
    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await payouts.useActions().isReady();

    expect(seen[0].pathname).toBe(
      `/api/accounts/${accountId}/affiliate/payouts`
    );
    expect(seen[0].searchParams.getAll("filter[created_at|before]")).toEqual([
      "1_days"
    ]);

    // Characterisation, not a discriminating control: the row id is read from
    // THIS filtered request's OWN recording (ADR-035 strict replay — each query
    // string is served its own verbatim capture, no base fallback). This
    // account's one payout is older than a day, so the filtered recording holds
    // exactly that one row; the pin proves the filtered row flows through to
    // context, while the request-observer assertion above pins the filter
    // branch itself.
    const rows = payouts.useContext().data.value;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(
      recordedPayoutId(
        "get-accounts-id-affiliate-payouts-filter-created-at-before-1-days-with-staged-imports-1"
      )
    );
  });

  it("an amount sort write carries the declared field and direction on the wire, and the recorded row still comes back", async () => {
    const accountId = recordedAccountId();
    const payouts = useAffiliatePayouts().as(ScopeActorTypes.CLIENT);
    await payouts.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/payouts")) seen.push(url);
    });

    payouts.useActions().setCriteria({
      sort: [{ field: "amount", dir: "desc" as SortDirection }]
    });

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await payouts.useActions().isReady();

    expect(seen[0].pathname).toBe(
      `/api/accounts/${accountId}/affiliate/payouts`
    );
    // `desc`, not `asc` — a mutant that drops the direction still produces
    // `order=amount`, so only the `-` prefix pins the direction itself.
    expect(seen[0].searchParams.getAll("order")).toEqual(["-amount"]);

    // Characterisation, not a discriminating control: `order` is not part of
    // the replay identity (fixture-handlers.ts), so a sort write is served the
    // base list capture — this pins the row read still resolves after the
    // write, not that the sort reordered a second row this account does not
    // have.
    const rows = payouts.useContext().data.value;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(recordedPayoutId());
  });

  it("a destination filter column is refused — the payouts schema declares no such column (design.md §8.3)", async () => {
    const accountId = recordedAccountId();
    const payouts = useAffiliatePayouts().as(ScopeActorTypes.CLIENT);
    await payouts.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/payouts")) seen.push(url);
    });

    // `destination` is not a member of `AffiliatePayoutsQueryModel.filters` —
    // forced past the type to prove the RUNTIME refusal design.md §8.11
    // `destination-filter` names, not merely a compile-time one. A real
    // `sort` change rides alongside it so the query key changes for a
    // legitimate reason too — an invalid-only filter key can be normalised
    // away with no key change at all, which would leave `seen` empty for a
    // reason unrelated to this control.
    payouts.useActions().setCriteria({
      sort: [{ field: "amount", dir: "desc" }],
      filters: { destination: { eq: "wallet" } }
    } as never);

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await payouts.useActions().isReady();

    expect(seen[0].pathname).toBe(
      `/api/accounts/${accountId}/affiliate/payouts`
    );
    for (const [key] of seen[0].searchParams.entries()) {
      expect(key.startsWith("filter[destination")).toBe(false);
    }
  });

  // The paging EDGE (a written page boundary returning a DIFFERENT row) stays
  // `@todo` in `affiliate.feature` (AC21, DV3/DV4) — this account carries
  // exactly 1 real row (`total: 1` on the recorded capture), so there is no
  // in-bounds non-zero offset to write: `offset: 1` would exceed the one
  // real row and trigger the query core's own last-page recovery (the
  // dropped P43 divergence, query core off limits), not this module's own
  // pagination-write logic. Only the explicit LIMIT write is proven below —
  // the OFFSET half is a named gap, not proven, because `offset: 0` is the
  // schema's own default and a dropped-offset mutant would not redden it.
  it("a page-size write carries the explicit limit param on the outbound request (the offset half is a named gap — one real row, no in-bounds non-zero offset), and the recorded row still comes back", async () => {
    const accountId = recordedAccountId();
    const payouts = useAffiliatePayouts().as(ScopeActorTypes.CLIENT);
    await payouts.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/payouts")) seen.push(url);
    });

    payouts.useActions().setCriteria({ pagination: { limit: 20, offset: 0 } });

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await payouts.useActions().isReady();

    expect(seen[0].pathname).toBe(
      `/api/accounts/${accountId}/affiliate/payouts`
    );
    expect(seen[0].searchParams.getAll("limit")).toEqual(["20"]);
    // Named gap, not a proof: `offset: 0` is the schema's own default, so
    // this line only documents the wire shape — it cannot discriminate a
    // mutant that drops the offset write (see the comment above).
    expect(seen[0].searchParams.getAll("offset")).toEqual(["0"]);

    const rows = payouts.useContext().data.value;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(recordedPayoutId());
  });

  it("the payout history publishes a criteria form that filters by creation date over its own criteria", async () => {
    const payouts = useAffiliatePayouts().as(ScopeActorTypes.CLIENT);
    await payouts.useActions().isReady();

    const { schema, uischema } = payouts.useContext().schemas.query;
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
