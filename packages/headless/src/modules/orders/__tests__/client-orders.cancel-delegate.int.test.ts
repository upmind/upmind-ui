// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — cancel() through the cancellation port
 * (AC-21, design 6.5, 8.2, D-21)
 *
 * ## Job To Be Done
 * Prove each row of the design 8.2 port contract, with the order view and the
 * order history both open:
 * - gate refused (`canCancel` false): resolves, calls no port, sends nothing
 * - no port: rejects with `OrderCancellationUnavailableError`, sends nothing
 * - port resolves: the port receives the order `contract_id`, `isProcessing`
 *   is true while the port holds its promise, and the `invoices` root goes
 *   stale, so the order and the history each read again
 * - port rejects: `cancel()` rejects with the same error, nothing goes stale
 * - the remover of `provideOrderCancellation` clears only its own port
 *
 * ## Provenance
 * The refused gate replays the recorded paid single read, the open gate the
 * recorded unpaid single read, each on its own id. The history replays the
 * strict list pool. The port is a recording function, because FE-3040 owns the
 * live flow and this module sends no cancel request of its own.
 *
 * ## What Breaks If These Fail
 * A settled order fires a real cancellation, a cancellable order never
 * reaches the flow, the history shows a cancelled order as live, or a stale
 * remover disconnects the flow that FE-3040 registered after it.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OrderCancellationUnavailableError,
  provideOrderCancellation,
  useClientOrder,
  useClientOrders
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  capturedOrder,
  observeModuleRequests,
  seedClientSession,
  serveRecordedOrder,
  settle
} from "./client-orders.int-helpers";
import type { OrderEnvelope } from "./client-orders.int-helpers";

// -----------------------------------------------------------------------------

const PAID = capturedOrder("get-invoices-id-case-order-paid");
const UNPAID = capturedOrder("get-invoices-id-case-order-unpaid");

let removePort: (() => void) | undefined;

afterEach(() => {
  removePort?.();
  removePort = undefined;
});

async function bootOn(envelope: OrderEnvelope) {
  await seedClientSession();
  serveRecordedOrder(envelope);
  const id = envelope.data.id as string;
  const history = useClientOrders().as(ScopeActorTypes.SELF);
  const manager = useClientOrder().as(ScopeActorTypes.SELF).withId(id);
  await vi.waitFor(() => {
    expect(history.useMeta().isLoading.value).toBe(false);
    expect(manager.useMeta().isLoading.value).toBe(false);
    expect(manager.useContext().data.value?.id).toBe(id);
  });
  await settle();
  const observed = observeModuleRequests();
  const path = (request: { url: string }) => new URL(request.url).pathname;
  return {
    manager,
    all: () => observed.all(),
    orderReads: () =>
      observed.all().filter(request => path(request) === `/api/invoices/${id}`),
    historyReads: () =>
      observed.all().filter(request => path(request) === "/api/invoices")
  };
}

// -----------------------------------------------------------------------------

describe("client-orders — cancel() through the cancellation port (AC-21)", () => {
  it("a refused gate (a recorded PAID order) resolves, calls no port and sends no request", async () => {
    const { manager, all } = await bootOn(PAID);
    const port = vi.fn().mockResolvedValue(undefined);
    removePort = provideOrderCancellation(port);

    expect(manager.useMeta().canCancel.value).toBe(false);
    await expect(manager.useActions().cancel()).resolves.toBeUndefined();
    await settle();

    expect(port).not.toHaveBeenCalled();
    expect(all()).toEqual([]);
    expect(manager.useMeta().isProcessing.value).toBe(false);
  });

  it("with no connected flow, a cancellable order rejects with OrderCancellationUnavailableError and sends no request", async () => {
    const { manager, all } = await bootOn(UNPAID);

    expect(manager.useMeta().canCancel.value).toBe(true);
    await expect(manager.useActions().cancel()).rejects.toBeInstanceOf(
      OrderCancellationUnavailableError
    );
    await settle();

    expect(all()).toEqual([]);
    expect(manager.useMeta().isProcessing.value).toBe(false);
  });

  it("a connected port receives the order contract, holds isProcessing, and on resolve marks the order and the history stale", async () => {
    const { manager, orderReads, historyReads } = await bootOn(UNPAID);
    let release: () => void = () => {};
    const port = vi.fn(
      () =>
        new Promise<void>(resolve => {
          release = resolve;
        })
    );
    removePort = provideOrderCancellation(port);

    const pending = manager.useActions().cancel();
    await vi.waitFor(() => expect(port).toHaveBeenCalledTimes(1));
    expect(port).toHaveBeenCalledWith(UNPAID.data.contract_id);
    expect(manager.useMeta().isProcessing.value).toBe(true);
    expect(orderReads()).toEqual([]);
    expect(historyReads()).toEqual([]);

    release();
    await expect(pending).resolves.toBeUndefined();

    expect(manager.useMeta().isProcessing.value).toBe(false);
    await vi.waitFor(() => {
      expect(orderReads().length).toBeGreaterThan(0);
      expect(historyReads().length).toBeGreaterThan(0);
    });
  });

  it("a rejecting port rejects cancel() with the same error and marks nothing stale", async () => {
    const { manager, orderReads, historyReads } = await bootOn(UNPAID);
    const failure = new Error("contract cancellation refused");
    removePort = provideOrderCancellation(vi.fn().mockRejectedValue(failure));

    await expect(manager.useActions().cancel()).rejects.toBe(failure);
    await settle();

    expect(orderReads()).toEqual([]);
    expect(historyReads()).toEqual([]);
    expect(manager.useMeta().isProcessing.value).toBe(false);
  });
});

describe("client-orders — the remover of provideOrderCancellation (AC-21, D-21)", () => {
  it("a stale remover leaves the later port connected, and the current remover disconnects it", async () => {
    const { manager } = await bootOn(UNPAID);
    const first = vi.fn().mockResolvedValue(undefined);
    const second = vi.fn().mockResolvedValue(undefined);

    const removeFirst = provideOrderCancellation(first);
    const removeSecond = provideOrderCancellation(second);
    removeFirst();

    await manager.useActions().cancel();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(UNPAID.data.contract_id);

    removeSecond();
    await expect(manager.useActions().cancel()).rejects.toBeInstanceOf(
      OrderCancellationUnavailableError
    );
  });
});
