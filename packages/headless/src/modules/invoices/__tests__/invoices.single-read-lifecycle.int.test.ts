// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices single read — refresh and invalidate re-read the
 * live record
 *
 * ## Job To Be Done
 * Prove `useInvoice().withId(id).useActions().refresh()` and `.invalidate()`
 * each cause a fresh outbound `GET /invoices/{id}`, mirroring the collection's
 * own AC-3 `refresh()` proof (`invoices.collection.int.test.ts`). Carried
 * forward from `gitlab/develop`'s stale `invoices.int.test.ts`
 * (`@INV-refresh` / `@INV-invalidate`), restated on the new
 * `useInvoice().withId(id)` surface — the query variant has no state machine
 * (design.md), so this is only observable across the real HTTP boundary, not
 * mockable as an isolated unit-level API-contract test.
 *
 * ## Provenance
 * Every body served is `recorded.unpaid()` / `recorded.paid()` — REAL
 * captured rows.
 *
 * ## What Breaks If These Fail
 * A client refreshing an invoice after a payment, or invalidating a stale
 * cache entry, keeps seeing the old balance.
 */

import { describe, expect, it, vi } from "vitest";
import { useInvoice } from "..";
import {
  installInvoiceHandlers,
  observeInvoiceRequests,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import type { WireInvoice } from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

function envelope(data: WireInvoice) {
  return {
    status: "ok",
    data,
    total: null,
    error: null,
    messages: null,
    meta: null
  };
}

describe("invoices single read — refresh re-reads the live record", () => {
  it("refresh() issues a SECOND outbound GET /invoices/{id}", async () => {
    const row = recorded.unpaid();
    await seedClientSession();
    const handlers = installInvoiceHandlers();
    handlers.setOneBody(envelope(row));
    const observed = observeInvoiceRequests();

    const single = useInvoice().withId(row.id);
    await vi.waitFor(() =>
      expect(single.useMeta().isLoading.value).toBe(false)
    );
    const afterFirst = observed.matching(`/invoices/${row.id}`).length;

    await single.useActions().refresh();

    await vi.waitFor(() =>
      expect(observed.matching(`/invoices/${row.id}`).length).toBeGreaterThan(
        afterFirst
      )
    );
    observed.stop();
  });
});

describe("invoices single read — invalidate drops the cache", () => {
  it("invalidate() causes the next read to re-fetch rather than serve a stale cache hit", async () => {
    const unpaid = recorded.unpaid();
    const paid = recorded.paid();
    await seedClientSession();
    const handlers = installInvoiceHandlers();
    handlers.setOneBody(envelope({ ...unpaid, id: paid.id }));

    const single = useInvoice().withId(paid.id);
    await vi.waitFor(() =>
      expect(single.useContext().data.value?.summary.unpaidAmount).toBe(
        unpaid.unpaid_amount
      )
    );

    handlers.setOneBody(envelope(paid));
    single.useActions().invalidate();

    await vi.waitFor(() =>
      expect(single.useContext().data.value?.summary.unpaidAmount).toBe(
        paid.unpaid_amount
      )
    );
  });
});
