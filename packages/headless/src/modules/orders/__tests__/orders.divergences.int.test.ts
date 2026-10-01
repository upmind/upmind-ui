// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the accepted divergences from the legacy
 * application (AC-24, design 8.9, parity row 21 / E1)
 *
 * ## Job To Be Done
 * Prove each of the four accepted divergences of design 8.9:
 * 1. Equal spelling: an equal write sends `filter[<col>|eq]`, never the bare key.
 * 2. One search leaf: the last write of `number.eq` wins, a clear removes it.
 * 3. Past the last page (parity row 21, E1 signed off 2026-09-28): a read past
 *    the last page with a total above zero lands on the last page, never page 1.
 * 4. Pay surface: the manager actions carry `usePayment`, and no `pay`.
 *
 * ## Provenance
 * Divergence 3 is answered by the strict pool: `orders-past-last-page`
 * (`data: []`, `total > 0`), `orders-last-page` (the rows of the last page)
 * and `orders-default`, each on its own recorded offset. Once the read past
 * the last page is out, the spec drops every inactive query, the offset-0
 * boot page included, so a move to offset 0 has to reach the wire. The
 * search term of divergence 2 comes from the recorded `orders-search` capture.
 *
 * ## Not proven here
 * The record half of AC-24: `docs/gotchas.md` does not exist, so the four
 * `## Accepted divergence N` headings of design 8.9 have no file to read.
 *
 * ## What Breaks If These Fail
 * A behaviour that differs from the legacy portal ships with no record, or the
 * record claims a behaviour the module does not have.
 */

import { describe, expect, it, vi } from "vitest";
import { useOrder, useOrders } from "..";
import { queryClient } from "../../query/client";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  capture,
  capturedOrder,
  observeOrderRequests,
  recordedParam,
  seedClientSession,
  settle
} from "./orders.int-helpers";

// -----------------------------------------------------------------------------

function recordedOffset(path: string): number {
  return Number(new URL(path, "http://x").searchParams.get("offset"));
}

async function bootCollection() {
  await seedClientSession();
  const orders = useOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

// -----------------------------------------------------------------------------

describe("orders — the accepted divergences are recorded and proven (AC-24)", () => {
  it("divergence 1: an equal status write sends filter[status.code|eq], never the bare key", async () => {
    const orders = await bootCollection();
    const observed = observeOrderRequests();

    orders.useActions().filters.status(["invoice_paid"]);
    await vi.waitFor(() =>
      expect(observed.latestParams().get("filter[status.code|eq]")).toBe(
        "invoice_paid"
      )
    );
    expect(observed.latestParams().has("filter[status.code]")).toBe(false);
  });

  it("divergence 2: a search, then a raw number.eq write, then a clear — the last write wins and the clear removes it", async () => {
    const orders = await bootCollection();
    const observed = observeOrderRequests();
    const searched = recordedParam(
      "get-invoices-case-orders-search",
      "filter[number|eq]"
    );
    const rawWritten = `${searched}-raw`;

    orders.useActions().filters.query(searched);
    await vi.waitFor(() =>
      expect(observed.latestParams().get("filter[number|eq]")).toBe(searched)
    );

    const live = orders.useContext().query.value.filters ?? {};
    orders.useInternals().query.setCriteria({
      filters: { ...live, number: { eq: rawWritten } }
    });
    await vi.waitFor(() =>
      expect(observed.latestParams().get("filter[number|eq]")).toBe(rawWritten)
    );
    expect(observed.latestParams().getAll("filter[number|eq]")).toHaveLength(1);

    const requestsBeforeClear = observed.all().length;
    orders.useActions().filters.query("");
    await vi.waitFor(() =>
      expect(orders.useContext().query.value.filters?.number).toBeUndefined()
    );
    const afterClear = observed.all().slice(requestsBeforeClear);
    for (const request of afterClear) {
      expect(new URL(request.url).searchParams.has("filter[number|eq]")).toBe(
        false
      );
    }
  });

  it("divergence 3: a read past the last page with orders remaining lands on the last page, never on page one", async () => {
    const past = capture("get-invoices-case-orders-past-last-page");
    const last = capture("get-invoices-case-orders-last-page");
    const pastOffset = recordedOffset(past.request.path);
    const lastOffset = recordedOffset(last.request.path);
    const lastRows = (last.response.body as { data: Array<{ id: string }> })
      .data;

    const orders = await bootCollection();
    const observed = observeOrderRequests();
    const offsets = () =>
      observed
        .all()
        .map(request => new URL(request.url).searchParams.get("offset"));

    orders.useActions().setPage(pastOffset / 10 + 1);
    await vi.waitFor(() => expect(offsets()).toContain(String(pastOffset)));
    queryClient.removeQueries({ type: "inactive" });

    await vi.waitFor(() => expect(offsets()).toContain(String(lastOffset)), {
      timeout: 5000
    });
    expect(offsets().indexOf(String(pastOffset))).toBeLessThan(
      offsets().lastIndexOf(String(lastOffset))
    );
    await vi.waitFor(() =>
      expect(orders.useContext().data.value?.map(row => row.id)).toEqual(
        lastRows.map(row => row.id)
      )
    );
    await settle();

    expect(offsets()).not.toContain("0");
    expect(orders.useContext().query.value.pagination?.offset).toBe(lastOffset);
    expect(orders.useContext().pagination.value?.page).toBe(
      lastOffset / 10 + 1
    );
  });

  it("divergence 4: the manager actions carry usePayment, and no pay member", async () => {
    await seedClientSession();
    const actions = useOrder()
      .as(ScopeActorTypes.SELF)
      .withId(
        capturedOrder("get-invoices-id-case-order-paid").data.id as string
      )
      .useActions();

    expect(typeof actions.usePayment).toBe("function");
    expect("pay" in actions).toBe(false);
  });
});
