// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — a failed brand settle leaves the history
 * settled with an error (AC-2, D-22)
 *
 * ## Job To Be Done
 * Prove design 6.1 step 6: when the brand settings read fails, the brand
 * settles with no id, and the collection settles with an error within 5 s.
 * `hasError` is true, `isReady()` resolves `false`, and no list request asks
 * for `brand`. It never waits on an unbounded brand poll.
 *
 * ## Provenance
 * Injected failure (design 8.8, "brand failure"): the brand settings read
 * answered with a 4xx, the recorded staging not-found envelope. One brand
 * state per file.
 *
 * ## What Breaks If These Fail
 * A brand outage leaves the order history spinning forever, or sends a list
 * read the platform cannot scope.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  capture,
  observeOrderRequests,
  seedClientSession
} from "./client-orders.int-helpers";

// -----------------------------------------------------------------------------

async function bootOnBrandFailure() {
  const refusal = capture("get-invoices-id-case-order-not-found").response;
  await seedClientSession([
    http.get("*/brand/settings", () =>
      HttpResponse.json(refusal.body as object, { status: refusal.status })
    )
  ]);
  const observed = observeOrderRequests();
  const orders = useClientOrders().as(ScopeActorTypes.SELF);
  orders.useMeta();
  return { orders, observed };
}

describe("client-orders — the brand fails to settle (AC-2)", () => {
  it("hasError is true within 5 s, and no list request asks for brand", async () => {
    const { orders, observed } = await bootOnBrandFailure();

    await vi.waitFor(() => expect(orders.useMeta().hasError.value).toBe(true), {
      timeout: 5000
    });
    expect(orders.useMeta().isLoading.value).toBe(false);
    for (const request of observed.all()) {
      expect(
        (new URL(request.url).searchParams.get("with") ?? "").split(",")
      ).not.toContain("brand");
    }
  });

  it("isReady() resolves false and hasError is true within 5 s", async () => {
    const { orders } = await bootOnBrandFailure();

    const ready = await Promise.race([
      orders.useActions().isReady(),
      new Promise<"timeout">(resolve =>
        setTimeout(() => resolve("timeout"), 5000)
      )
    ]);

    expect(orders.useMeta().hasError.value).toBe(true);
    expect(ready).toBe(false);
  }, 15000);
});
