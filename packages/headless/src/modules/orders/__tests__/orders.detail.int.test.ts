// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the order detail projection (AC-14, design 8.7)
 *
 * ## Job To Be Done
 * Prove `useOrder().useContext().detail` publishes each design 8.7
 * detail field from the recorded single reads: paid, unpaid and cancelled.
 * The referrer is `account.affiliate_referral.affiliate_account.account.client[0]`.
 * The cancellation reason is the contract reason, never the invoice-level
 * `cancellation_reason` that the cancelled capture also carries.
 *
 * ## Provenance
 * The recorded `order-paid`, `order-unpaid` and `order-cancelled-none-paid`
 * single reads, served on their own ids. Declared construction (design 8.8,
 * "referrer"): no staging paid order carries a referrer (the T16a disclosure
 * log), so the recorded paid read gets the referrer path set to the `client`
 * block of the same capture.
 *
 * ## Not proven here — escalated
 * The contract-reason read. `pnpm fixtures:generate orders` read every
 * cancelled order with no payment and reported: "no cancelled order of the 32
 * discovered with paid_amount 0 carries a contract cancellation_reason (AC14:
 * stop and tell the operator)". Design 8.8 declares no construction for it.
 *
 * ## What Breaks If These Fail
 * The order view blanks a field the client relies on, shows another client's
 * referrer, or shows the invoice reason as the contract cancellation reason.
 */

import { describe, expect, it, vi } from "vitest";
import { useOrder } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  capturedOrder,
  seedClientSession,
  serveRecordedOrder
} from "./orders.int-helpers";
import type { OrderEnvelope } from "./orders.int-helpers";

// -----------------------------------------------------------------------------

type OrderRecord = Record<string, unknown> & {
  status: { code: string };
  client: Record<string, unknown>;
  contract: { cancellation_reason: string | null } | null;
};

async function detailOf(envelope: OrderEnvelope) {
  await seedClientSession();
  serveRecordedOrder(envelope);
  const id = envelope.data.id as string;
  const manager = useOrder().as(ScopeActorTypes.SELF).withId(id);
  await vi.waitFor(() => expect(manager.useContext().data.value?.id).toBe(id));
  return manager.useContext().detail.value;
}

function withReferrer(envelope: OrderEnvelope): OrderEnvelope {
  const record = envelope.data as OrderRecord;
  return {
    ...envelope,
    data: {
      ...record,
      account: {
        ...(record.account as object),
        affiliate_referral: {
          affiliate_account: { account: { client: [record.client] } }
        }
      }
    }
  };
}

function expectEveryField(detail: unknown, record: OrderRecord) {
  expect(detail).toMatchObject({
    id: record.id,
    number: record.number,
    status: { code: record.status.code },
    totalAmountFormatted: record.total_amount_formatted,
    createdAt: record.created_at,
    paidDatetime: record.paid_datetime,
    dueDate: record.due_date,
    refundChanged: record.refund_changed,
    cancellationDatetime: record.cancellation_datetime,
    notes: record.notes,
    customFields: record.custom_fields,
    contractId: record.contract_id,
    brandId: record.brand_id
  });
}

describe("orders — the order detail projection (AC-14)", () => {
  it("publishes every legacy detail field from a real order, the referrer included", async () => {
    const paid = withReferrer(capturedOrder("get-invoices-id-case-order-paid"));
    const record = paid.data as OrderRecord;
    const detail = await detailOf(paid);

    expectEveryField(detail, record);
    expect(detail.contractId).not.toBe(record.id);
    expect(detail.referrer).toEqual(record.client);
    expect(detail.referrer?.id).toBe(record.client.id);
  });

  it("the recorded paid order with no referrer publishes no referrer", async () => {
    const detail = await detailOf(
      capturedOrder("get-invoices-id-case-order-paid")
    );
    expect(detail.referrer).toBeUndefined();
  });

  it("publishes every legacy detail field of an unpaid order", async () => {
    const unpaid = capturedOrder("get-invoices-id-case-order-unpaid");
    expectEveryField(await detailOf(unpaid), unpaid.data as OrderRecord);
  });

  it("a cancelled order publishes its cancellation moment, and never the invoice reason as its cancellation reason", async () => {
    const cancelled = capturedOrder(
      "get-invoices-id-case-order-cancelled-none-paid"
    );
    const record = cancelled.data as OrderRecord;
    expect(record.cancellation_reason).toBeTruthy();
    expect(record.cancellation_datetime).toBeTruthy();
    const detail = await detailOf(cancelled);

    expectEveryField(detail, record);
    expect(detail.cancellationDatetime).toBe(record.cancellation_datetime);
    expect(detail.cancellationReason).not.toBe(record.cancellation_reason);
  });

  it("publishes no client, address or administrator block (design 8.7)", async () => {
    const detail = await detailOf(
      capturedOrder("get-invoices-id-case-order-paid")
    );
    for (const block of ["client", "address", "administrator"]) {
      expect(detail).not.toHaveProperty(block);
    }
  });
});
