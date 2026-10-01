// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the brand relation is decided at request
 * time, after a late brand settles (AC-2, D-22)
 *
 * ## Job To Be Done
 * Prove that the collection sends no list request before the brand settings
 * answer, and that its first list request after a late multi-brand answer
 * carries `brand` (design 6.1 steps 4 and 5): the relation set is computed
 * when the request leaves, not when the collection is built.
 *
 * ## Provenance
 * Declared construction (design 8.8, "late brand settings"): the recorded
 * brand settings with `id` set to `UUID.ORG`, held until the collection has
 * started. One brand state per file.
 *
 * ## What Breaks If These Fail
 * A page that mounts before the brand loads reads a multi-brand history
 * without the brand of each order.
 */

import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { UUID } from "@upmind-automation/types";
import { useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  observeOrderRequests,
  recordedBrandSettings,
  seedClientSession,
  settle
} from "./client-orders.int-helpers";

// -----------------------------------------------------------------------------

describe("client-orders — a late multi-brand answer (AC-2)", () => {
  it("no list request leaves before the brand answers, and the first one after it carries brand", async () => {
    const settings = recordedBrandSettings();
    let released = false;
    let release: () => void = () => {};
    const answer = new Promise<void>(resolve => {
      release = () => {
        released = true;
        resolve();
      };
    });
    await seedClientSession([
      http.get("*/brand/settings", async () => {
        await answer;
        await delay(0);
        return HttpResponse.json({
          ...settings,
          data: { ...settings.data, id: UUID.ORG }
        });
      })
    ]);
    const observed = observeOrderRequests();

    const orders = useClientOrders().as(ScopeActorTypes.SELF);
    orders.useMeta();
    await settle(300);
    expect(released).toBe(false);
    expect(observed.all()).toEqual([]);

    release();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0), {
      timeout: 5000
    });

    const first = new URL(observed.first().url).searchParams;
    expect((first.get("with") ?? "").split(",")).toContain("brand");
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );
    expect(orders.useMeta().hasError.value).toBe(false);
  });
});
