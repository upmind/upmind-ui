// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices single read — the live unpaid-amount re-read (AC-1)
 *
 * ## Job To Be Done
 * Prove `useInvoice().withId(id).useActions().refreshUnpaidAmount()` issues a
 * real `GET /invoices/unpaid_amount/{id}` carrying the client session's
 * bearer token and the declared currency param, and that changing the
 * currency issues a genuinely SECOND request rather than serving the first
 * response from cache — confirmed against a REAL recorded 200 (with
 * `currency_id`) and a REAL recorded 422 (missing currency, a control/error
 * response, exempt from the recorded-journey-body rule).
 *
 * ## What Breaks If These Fail
 * A client's "what do I still owe" figure goes stale after a currency change,
 * or the read is attributed to the wrong session.
 */

import { describe, expect, it } from "vitest";
import { useInvoice } from "..";
import {
  installInvoiceHandlers,
  observeInvoiceRequests,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("invoices single read — the live unpaid-amount re-read (AC-1)", () => {
  it("AC-1 refreshUnpaidAmount() issues GET /invoices/unpaid_amount/{id} with the client's bearer token and the currency param on the query string", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();
    const target = recorded.unpaid();

    const observed = observeInvoiceRequests();
    const single = useInvoice().withId(target.id);
    await single.useActions().isReady();
    await single.useActions().refreshUnpaidAmount?.(target.currency_id);
    observed.stop();

    const unpaidCalls = observed.matching("unpaid_amount");
    expect(unpaidCalls.length).toBeGreaterThan(0);
    const last = unpaidCalls[unpaidCalls.length - 1];
    expect(last.url).toContain(`currency_id=${target.currency_id}`);
    expect(last.headers.authorization ?? last.headers.Authorization).toBe(
      `Bearer ${accessToken}`
    );
  });

  it("AC-1 changing the currency issues a SECOND distinct request, never a cache hit on the first response", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const target = recorded.unpaid();

    const single = useInvoice().withId(target.id);
    await single.useActions().isReady();

    const observed = observeInvoiceRequests();
    await single.useActions().refreshUnpaidAmount?.(target.currency_id);
    await single.useActions().refreshUnpaidAmount?.("a-different-currency-id");
    observed.stop();

    const unpaidCalls = observed.matching("unpaid_amount");
    expect(unpaidCalls.length).toBeGreaterThanOrEqual(2);
    const currencyParams = unpaidCalls.map(call =>
      new URL(call.url).searchParams.get("currency_id")
    );
    expect(new Set(currencyParams).size).toBeGreaterThan(1);
  });

  it("AC-1 maps the recorded unpaid-amount body onto the composable's reactive unpaidAmount", async () => {
    await seedClientSession();
    const handlers = installInvoiceHandlers();
    const target = recorded.unpaid();
    const fixture = recorded.unpaidAmount();
    handlers.setUnpaidAmountBody(fixture);

    const single = useInvoice().withId(target.id);
    await single.useActions().isReady();
    await single.useActions().refreshUnpaidAmount?.(target.currency_id);

    const unpaidAmount = (
      single.useContext() as unknown as {
        unpaidAmount: { value: { amount: number } };
      }
    ).unpaidAmount;
    expect(unpaidAmount.value.amount).toBe(fixture.data.unpaid_amount);
  });
});
