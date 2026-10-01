// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the list asks for the legacy relations, a
 * single-brand organisation (AC-2)
 *
 * ## Job To Be Done
 * Prove the first list request asks for exactly the legacy relation set
 * `tags,client,client.image,status,products`, with `with_count=products` and
 * no `brand`, when the recorded brand is not the multi-brand organisation
 * (design 8.1, D-16). The group files `-multibrand`, `-late-brand` and
 * `orders.list-readiness` hold the other brand states (design 8.8).
 *
 * ## Provenance
 * The recorded brand settings, whose id is not `UUID.ORG`, and the strict
 * list pool.
 *
 * ## What Breaks If These Fail
 * A dropped relation empties a row field, or a single-brand history asks the
 * platform for brands it never shows.
 */

import { describe, expect, it, vi } from "vitest";
import { UUID } from "@upmind-automation/types";
import { useOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  observeOrderRequests,
  recordedBrandSettings,
  seedClientSession
} from "./orders.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("orders — the list relation set, single-brand organisation (AC-2)", () => {
  it("the first request carries the legacy relation set, with_count=products, and no brand param", async () => {
    expect(recordedBrandSettings().data.id).not.toBe(UUID.ORG);
    await seedClientSession();
    const observed = observeOrderRequests();

    const orders = useOrders().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );

    const first = new URL(observed.first().url).searchParams;
    expect((first.get("with") ?? "").split(",").sort()).toEqual([
      "client",
      "client.image",
      "products",
      "status",
      "tags"
    ]);
    expect(first.get("with_count")).toBe("products");
    expect(orders.useMeta().isMultibrand.value).toBe(false);
    expect(orders.useMeta().hasError.value).toBe(false);
  });
});
