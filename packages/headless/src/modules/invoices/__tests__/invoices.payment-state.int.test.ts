// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices single read — overall payment state (AC-16)
 *
 * ## Job To Be Done
 * Prove the wired `PAYMENT_STATE` derivation `useInvoice().useMeta()` exposes
 * — paid / free / partial / pending, plus a failed load reporting an error
 * rather than a guessed state — instead of the four booleans the
 * pre-conversion flat module computed independently (design D3: "wired, not
 * deleted"). Carried forward from `gitlab/develop`'s stale
 * `invoices.surface.test.ts` (this dispatch's merge): design.md's C01-C23
 * capability list omitted this behaviour, so it is minted as AC-16
 * (`invoices.feature`) rather than silently dropped.
 *
 * ## Provenance
 * Every input is `recorded.unpaid()` — a REAL captured row — with an
 * explicitly labelled minimal set of fields toggled per state, the accepted
 * precedent in `invoices.mapping.int.test.ts` /
 * `client-email-history.mappers.test.ts`.
 *
 * ## What Breaks If These Fail
 * The panel re-prompts for payment on a settled invoice, or shows a receipt
 * for one still awaiting its first payment.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useInvoice } from "..";
import {
  installInvoiceHandlers,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import { server } from "./setup.integration";
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

async function openState(row: WireInvoice) {
  await seedClientSession();
  const handlers = installInvoiceHandlers();
  handlers.setOneBody(envelope(row));
  const single = useInvoice().withId(row.id);
  await vi.waitFor(() => expect(single.useMeta().isLoading.value).toBe(false));
  return single.useMeta();
}

// -----------------------------------------------------------------------------

describe("invoices single read — overall payment state (AC-16)", () => {
  it("AC-16 (constructed — payments present, unpaid_amount zeroed) derives a paid state", async () => {
    const row = recorded.unpaid();
    expect(row.payments.length).toBeGreaterThan(0);
    const toggled: WireInvoice = { ...row, unpaid_amount: 0 };

    const meta = await openState(toggled);
    expect(meta.isPaid.value).toBe(true);
    expect(meta.paymentState.value).toBe("complete");
  });

  it("AC-16 (constructed — no payments, unpaid_amount zeroed) derives a free state", async () => {
    const row = recorded.unpaid();
    const toggled: WireInvoice = { ...row, unpaid_amount: 0, payments: [] };

    const meta = await openState(toggled);
    expect(meta.isFree.value).toBe(true);
    expect(meta.paymentState.value).toBe("free");
  });

  it("AC-16 (constructed — a positive raw paid_amount alongside a positive unpaid_amount) derives a partial state", async () => {
    const row = recorded.unpaid();
    expect(row.unpaid_amount).toBeGreaterThan(0);
    const toggled = { ...row, paid_amount: 50 } as unknown as WireInvoice;

    const meta = await openState(toggled);
    expect(meta.isPartiallyPaid.value).toBe(true);
    expect(meta.paymentState.value).toBe("partial");
  });

  it("AC-16 (constructed — no payments, positive unpaid_amount) derives a pending state", async () => {
    const row = recorded.unpaid();
    const toggled: WireInvoice = { ...row, payments: [] };

    const meta = await openState(toggled);
    expect(meta.isPending.value).toBe(true);
    expect(meta.paymentState.value).toBe("pending");
  });

  it("AC-16 a failed load reports no guessed payment state", async () => {
    await seedClientSession();
    server.use(
      http.get("*/invoices/:id", () =>
        HttpResponse.json(
          { status: "error", data: null, error: { code: 500, message: "boom" } },
          { status: 500 }
        )
      )
    );

    const single = useInvoice().withId("00000000-0000-0000-0000-000000000000");

    await vi.waitFor(
      () => expect(single.useMeta().isLoading.value).toBe(false),
      { timeout: 10000 }
    );
    expect(single.useMeta().isPaid.value).toBe(false);
    expect(single.useMeta().isFree.value).toBe(false);
    expect(single.useMeta().isPartiallyPaid.value).toBe(false);
    expect(single.useMeta().isPending.value).toBe(false);
  });
});
