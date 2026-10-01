// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the manager counts the online gateways of the
 * ORDER's brand, not of the current brand (AC-19, design 8.1, D-15, D-26)
 *
 * ## Job To Be Done
 * Prove the manager sends one `GET api/brands/<order.brand_id>/gateways` with
 * `limit=count` and the online gateway types csv while the current brand is
 * another brand, and that `hasOnlineGateways` follows the envelope `total`.
 *
 * ## Provenance
 * Declared construction (design 8.8, "multi-brand organisation"): the recorded
 * brand settings with `id` set to `UUID.ORG`. One brand state per file. The
 * recorded `order-unpaid` single read, and the recorded `online` gateway read
 * served only on its own recorded request.
 *
 * ## What Breaks If These Fail
 * In a multi-brand organisation the order view counts the gateways of the
 * wrong brand, or hides the "Pay online" message on a brand with live gateways.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { UUID } from "@upmind-automation/types";
import { useOrder, useOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  capturedOrder,
  observeModuleRequests,
  recordedBrandSettings,
  seedClientSession,
  serveRecordedOrder
} from "./orders.int-helpers";

// -----------------------------------------------------------------------------

const UNPAID = capturedOrder("get-invoices-id-case-order-unpaid");
const ORDER_BRAND = UNPAID.data.brand_id as string;

async function bootOnOrganisation() {
  const settings = recordedBrandSettings();
  await seedClientSession([
    http.get("*/brand/settings", () =>
      HttpResponse.json({
        ...settings,
        data: { ...settings.data, id: UUID.ORG }
      })
    )
  ]);
  serveRecordedOrder(UNPAID);
  const observed = observeModuleRequests();
  const id = UNPAID.data.id as string;
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

describe("orders — the online gateways of the order's brand (AC-19)", () => {
  it("the gateway read counts the online gateways of order.brand_id while the current brand is the organisation, with limit=count and the online types csv", async () => {
    const { gatewayReads } = await bootOnOrganisation();
    await vi.waitFor(() =>
      expect(
        useOrders().as(ScopeActorTypes.SELF).useMeta().isMultibrand.value
      ).toBe(true)
    );
    expect(ORDER_BRAND).not.toBe(UUID.ORG);
    await vi.waitFor(() => expect(gatewayReads()).toHaveLength(1));

    const url = new URL(gatewayReads()[0].url);
    expect(url.pathname).toBe(`/api/brands/${ORDER_BRAND}/gateways`);
    expect(url.searchParams.get("limit")).toBe("count");
    expect(url.searchParams.get("filter[gateway.type]")).toBe("1,6,3,10,4");
  });

  it("the recorded order brand has online gateways: hasOnlineGateways is true", async () => {
    const online = captured<{ total: number }>(
      "get-brands-id-gateways-case-online"
    );
    expect(online.total).toBeGreaterThan(0);
    const { meta } = await bootOnOrganisation();
    await vi.waitFor(() => expect(meta.hasOnlineGateways.value).toBe(true));
  });
});
