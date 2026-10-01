// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the manager publishes its status-message
 * inputs (AC-19, design 8.1, 8.5, D-15, D-26)
 *
 * ## Job To Be Done
 * Prove `hasOnlineGateways` is false on a zero gateway total while the pay
 * gate stays open, and that `isDelegated` and `hasPendingPayment` follow the
 * order. The order-brand read and the true path live in
 * `orders.online-gateways`, on their own brand state.
 *
 * ## Provenance
 * Recorded single reads (design 8.1): unpaid and part-paid, served verbatim on
 * their own ids. The recorded `online` gateway read, served only on its own
 * recorded request. Declared constructions (design 8.8), each over a recorded
 * envelope:
 * - no online gateway: the recorded gateway envelope with `total: 0`
 * - delegated: the recorded unpaid read with `delegate_related: true`
 * - pending payment: the recorded part-paid read with its payment `pending: 1`
 *
 * ## What Breaks If These Fail
 * The order view closes the pay gate on a brand with no online gateway,
 * hides the delegated notice, or misses a payment in progress.
 */

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useOrder } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  capturedOrder,
  observeModuleRequests,
  seedClientSession,
  serveRecordedOrder,
  settle
} from "./orders.int-helpers";
import { server } from "./setup.integration";
import type { OrderEnvelope } from "./orders.int-helpers";

// -----------------------------------------------------------------------------

const UNPAID = capturedOrder("get-invoices-id-case-order-unpaid");
const PART_PAID = capturedOrder("get-invoices-id-case-order-part-paid");

async function bootManager(envelope: OrderEnvelope, gatewaysTotal?: number) {
  await seedClientSession();
  serveRecordedOrder(envelope);
  if (gatewaysTotal !== undefined) {
    const online = captured("get-brands-id-gateways-case-online");
    server?.use(
      http.get("*/api/brands/:brandId/gateways", () =>
        HttpResponse.json({ ...online, total: gatewaysTotal })
      )
    );
  }
  const observed = observeModuleRequests();
  const id = envelope.data.id as string;
  const manager = useOrder().as(ScopeActorTypes.SELF).withId(id);
  await vi.waitFor(() => {
    expect(manager.useMeta().isLoading.value).toBe(false);
    expect(manager.useContext().data.value?.id).toBe(id);
  });
  const gatewayReads = () =>
    observed
      .all()
      .filter(request =>
        /\/api\/brands\/[^/]+\/gateways$/.test(new URL(request.url).pathname)
      );
  return { meta: manager.useMeta(), gatewayReads };
}

// -----------------------------------------------------------------------------

describe("orders — the manager publishes its status-message inputs (AC-19)", () => {
  it("no online gateway: hasOnlineGateways is false, and canPay stays true", async () => {
    const { meta, gatewayReads } = await bootManager(UNPAID, 0);
    await vi.waitFor(() => expect(gatewayReads()).toHaveLength(1));
    await settle();

    expect(meta.hasOnlineGateways.value).toBe(false);
    expect(meta.canPay.value).toBe(true);
  });

  it("the recorded unpaid order is not delegated; the delegated construction is", async () => {
    expect(UNPAID.data.delegate_related).toBe(false);
    expect((await bootManager(UNPAID)).meta.isDelegated.value).toBe(false);

    const { meta } = await bootManager({
      ...UNPAID,
      data: { ...UNPAID.data, delegate_related: true }
    });
    expect(meta.isDelegated.value).toBe(true);
  });

  it("the recorded part-paid order has no pending payment; the pending construction has one", async () => {
    const payments = PART_PAID.data.payments as Array<Record<string, unknown>>;
    expect(payments.length).toBeGreaterThan(0);
    expect((await bootManager(PART_PAID)).meta.hasPendingPayment.value).toBe(
      false
    );

    const { meta } = await bootManager({
      ...PART_PAID,
      data: {
        ...PART_PAID.data,
        payments: payments.map((payment, index) =>
          index === 0 ? { ...payment, pending: 1 } : payment
        )
      }
    });
    expect(meta.hasPendingPayment.value).toBe(true);
  });
});
