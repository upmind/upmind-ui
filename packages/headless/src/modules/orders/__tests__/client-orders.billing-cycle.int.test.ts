// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — each subscription item names its billing
 * cycle once the cycles answer (AC-15, D-25)
 *
 * ## Job To Be Done
 * Prove design 6.3 step 6: the manager asks the `system` module for the
 * billing cycles and does not wait for them. While `api/billing_cycles` is
 * held, the order and its items publish, and each `billingCycle` is
 * `undefined`. After the answer, each subscription item carries the recorded
 * cycle of its `billingCycleMonths`. The spec runs the race of design 6.3 on
 * each run: it reads `products` before the answer, then after it.
 *
 * ## Provenance
 * The recorded `order-snapshot` single read and the recorded `order-items`
 * billing cycles read, held with a deferred handler. The billing cycles read
 * is a module-level singleton, so this file loads it once (design 8.8).
 *
 * ## What Breaks If These Fail
 * A subscription item never shows "Monthly", or the order view waits on the
 * billing cycles.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientOrder } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  capturedOrder,
  observeModuleRequests,
  seedClientSession,
  serveRecordedOrder,
  settle
} from "./client-orders.int-helpers";

// -----------------------------------------------------------------------------

const SNAPSHOT = capturedOrder("get-invoices-id-case-order-snapshot");
const CYCLES = captured<{ data: Array<{ months: number; name: string }> }>(
  "get-billing-cycles-case-order-items"
);

describe("client-orders — the billing-cycle name of each item (AC-15)", () => {
  it("the recorded cycle name on the billingCycle of the first subscription row, after the api/billing_cycles answer", async () => {
    let release: () => void = () => {};
    const held = new Promise<void>(resolve => {
      release = resolve;
    });
    await seedClientSession([
      http.get("*/billing_cycles", async () => {
        await held;
        return HttpResponse.json(CYCLES);
      })
    ]);
    serveRecordedOrder(SNAPSHOT);
    const observed = observeModuleRequests();
    const id = SNAPSHOT.data.id as string;

    const manager = useClientOrder().as(ScopeActorTypes.SELF).withId(id);
    await vi.waitFor(() =>
      expect(manager.useContext().data.value?.id).toBe(id)
    );
    await vi.waitFor(() =>
      expect(
        observed.all().some(request => request.url.includes("/billing_cycles"))
      ).toBe(true)
    );
    await settle();

    const before = manager.useContext().products.value;
    expect(before.length).toBeGreaterThan(0);
    expect(manager.useMeta().isLoading.value).toBe(false);
    for (const item of before) expect(item.billingCycle).toBeUndefined();

    release();

    await vi.waitFor(() =>
      expect(manager.useContext().products.value[0]?.billingCycle?.name).toBe(
        CYCLES.data.find(
          cycle =>
            cycle.months ===
            manager.useContext().products.value[0].billingCycleMonths
        )?.name
      )
    );
    for (const item of manager
      .useContext()
      .products.value.filter(row => row.isSubscription)) {
      expect(item.billingCycle?.months).toBe(item.billingCycleMonths);
    }
    expect(manager.useContext().products.value[0].billingCycle?.name).toBe(
      "Monthly"
    );
  });
});
