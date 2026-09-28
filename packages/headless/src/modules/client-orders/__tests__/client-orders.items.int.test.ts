// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the order items project the snapshot lines
 * (AC-15, design 8.7)
 *
 * ## Job To Be Done
 * Prove `useClientOrder().useContext().products` projects the snapshot items
 * of the order by the design 8.7 rules: each legacy field, the billing term
 * with the product-term fallback, the subscription flag, the contract links
 * and the item link under the brand's one-time-purchases rule. A thin recorded
 * record gives empty fields and no error (design 8.11).
 *
 * ## Provenance
 * The recorded `order-snapshot` single read (one subscription line, no live
 * `products`: the design 8.1 read does not ask for them). The thin record is
 * the `orders` module's recorded `get-invoices-id-case-unpaid`. Declared
 * constructions (design 8.8):
 * - one-time purchases `hidden`: the recorded brand settings with
 *   `meta.portal["@context.oneTimePurchases"]` set to `hidden` (this file)
 * - snapshot term rows: the snapshot line with `billing_cycle_months: 0`,
 *   keeping its product term, and a second line in days only
 *
 * ## Not proven here — escalated
 * Staging holds no snapshot item with options or attributes and no order with
 * contract product tags, so the sub-item split and the tag grouping of design
 * 8.7 have no capture (design 8.8: stop and tell the operator). The design 8.1
 * read returns no live `products`, so the snapshot precedence, the live
 * fallback and the empty-array rule each give the same items with or without
 * the rule. The snapshot term rows keep the product term, so no row has a zero
 * `billingCycleMonths` and the hidden rule cannot give `canLink` false. Design
 * 8.8 declares no construction for either state.
 *
 * ## What Breaks If These Fail
 * The order view lists the live items in place of what the client bought, a
 * subscription shows no term, or a one-time purchase links when the brand
 * hides it.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientOrder } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  capturedOrder,
  recordedBrandSettings,
  seedClientSession,
  serveRecordedOrder
} from "./client-orders.int-helpers";
import type { OrderEnvelope } from "./client-orders.int-helpers";

// -----------------------------------------------------------------------------

type SnapshotLine = Record<string, unknown> & {
  id: string;
  name: string;
  service_identifier: string | null;
  client_label: string | null;
  contract_id: string | null;
  contracts_product_id: string;
  quantity: number;
  billing_cycle_months: number;
  billing_cycle_days: number;
  configuration_net_selling_price_discounted_formatted: string;
  configuration_net_amount_discounted_formatted: string;
  product: {
    id: string;
    brand_id: string;
    contract_id?: string | null;
    billing_cycle_months: number;
  };
};

const SNAPSHOT = capturedOrder("get-invoices-id-case-order-snapshot");
const LINES = (
  SNAPSHOT.data.current_data as { content: { products: SnapshotLine[] } }
).content.products;

function withLines(lines: SnapshotLine[] | undefined): OrderEnvelope {
  const data = structuredClone(SNAPSHOT.data) as Record<string, unknown> & {
    current_data: { content: Record<string, unknown> };
  };
  if (lines === undefined) delete data.current_data.content.products;
  else data.current_data.content.products = lines;
  return { ...SNAPSHOT, data };
}

async function itemsOf(envelope: OrderEnvelope) {
  const settings = recordedBrandSettings();
  await seedClientSession([
    http.get("*/brand/settings", () =>
      HttpResponse.json({
        ...settings,
        data: {
          ...settings.data,
          meta: {
            ...settings.data.meta,
            portal: { "@context.oneTimePurchases": "hidden" }
          }
        }
      })
    )
  ]);
  serveRecordedOrder(envelope);
  const id = envelope.data.id as string;
  const manager = useClientOrder().as(ScopeActorTypes.SELF).withId(id);
  await vi.waitFor(() => expect(manager.useContext().data.value?.id).toBe(id));
  return manager;
}

// -----------------------------------------------------------------------------

describe("client-orders — the order items project the snapshot lines (AC-15)", () => {
  it("each snapshot line becomes one item with its legacy fields and contract links", async () => {
    expect(LINES.length).toBeGreaterThan(0);
    expect(SNAPSHOT.data.products ?? []).toEqual([]);
    const manager = await itemsOf(SNAPSHOT);
    const items = manager.useContext().products.value;

    expect(items.map(item => item.id)).toEqual(LINES.map(line => line.id));
    items.forEach((item, index) => {
      const line = LINES[index];
      expect(item).toMatchObject({
        brandId: line.product.brand_id,
        contractProductId: line.contracts_product_id,
        contractId: line.contract_id || SNAPSHOT.data.contract_id,
        name: [
          line.name,
          line.service_identifier ? `(${line.service_identifier})` : null
        ]
          .filter(Boolean)
          .join(" "),
        reference: line.client_label || "",
        quantity: line.quantity,
        price: line.configuration_net_selling_price_discounted_formatted,
        total: line.configuration_net_amount_discounted_formatted,
        billingCycleMonths: line.billing_cycle_months,
        isSubscription: true,
        hasSubItems: false,
        canLink: true
      });
      expect(item.period).toBeUndefined();
    });
  });

  it("billingCycleMonths on the zero-term row falls back to the product term, and a days-only row is a subscription", async () => {
    const [line] = LINES;
    expect(line.product.billing_cycle_months).toBeGreaterThan(0);
    const zeroTerm = { ...line, billing_cycle_months: 0 };
    const daysOnly = {
      ...line,
      id: `${line.id}-days`,
      billing_cycle_months: 0,
      billing_cycle_days: 30
    };

    const manager = await itemsOf(withLines([zeroTerm, daysOnly]));
    const [first, second] = manager.useContext().products.value;

    expect(first.billingCycleMonths).toBe(line.product.billing_cycle_months);
    expect(first.isSubscription).toBe(true);
    expect(first.canLink).toBe(true);
    expect(second.isSubscription).toBe(true);
    expect(second.canLink).toBe(true);
  });

  it("a thin recorded record publishes empty fields and no error (design 8.11)", async () => {
    const thin = JSON.parse(
      readFileSync(
        join(
          import.meta.dirname,
          "../../orders/__tests__/fixtures/get-invoices-id-case-unpaid.json"
        ),
        "utf-8"
      )
    ).response.body as OrderEnvelope;
    const manager = await itemsOf(thin);

    expect(manager.useMeta().hasError.value).toBe(false);
    expect(manager.useContext().detail.value.referrer).toBeUndefined();
    expect(manager.useContext().detail.value.id).toBe(thin.data.id);
    expect(Array.isArray(manager.useContext().products.value)).toBe(true);
  });
});
