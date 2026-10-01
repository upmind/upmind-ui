// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the list asks for the brand of each order in
 * a multi-brand organisation (AC-2, AC-6)
 *
 * ## Job To Be Done
 * Prove that when the brand is the multi-brand organisation (`UUID.ORG`),
 * the first list request adds `brand` to the legacy relation set, and each
 * published row carries its `brand.name` (design 8.1, 8.7, D-16).
 *
 * ## Provenance
 * Declared construction (design 8.8, "multi-brand organisation"): the recorded
 * brand settings with `id` set to `UUID.ORG`. One brand state per file. The
 * strict list pool answers the brand-relation read with the recorded
 * `orders-multibrand` capture.
 *
 * ## What Breaks If These Fail
 * A multi-brand client cannot see which brand sold each order.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { UUID } from "@upmind-automation/types";
import { useOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  observeOrderRequests,
  recordedBrandSettings,
  seedClientSession
} from "./orders.int-helpers";

// -----------------------------------------------------------------------------

describe("orders — the list relation set, multi-brand organisation (AC-2)", () => {
  it("the first request adds brand to the legacy relations, and each row carries its brand name (AC-6)", async () => {
    const settings = recordedBrandSettings();
    await seedClientSession([
      http.get("*/brand/settings", () =>
        HttpResponse.json({
          ...settings,
          data: { ...settings.data, id: UUID.ORG }
        })
      )
    ]);
    const observed = observeOrderRequests();

    const orders = useOrders().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );

    const first = new URL(observed.first().url).searchParams;
    expect((first.get("with") ?? "").split(",").sort()).toEqual([
      "brand",
      "client",
      "client.image",
      "products",
      "status",
      "tags"
    ]);
    expect(orders.useMeta().isMultibrand.value).toBe(true);

    const recorded = captured("get-invoices-case-orders-multibrand")
      .data as Array<{
      brand: { name: string };
    }>;
    const rows = (orders.useContext().data.value ?? []) as unknown as Array<{
      brand?: { name?: string };
    }>;
    expect(rows).toHaveLength(recorded.length);
    expect(rows.map(row => row.brand?.name)).toEqual(
      recorded.map(row => row.brand.name)
    );
    expect(rows.every(row => !!row.brand?.name)).toBe(true);
  });
});
