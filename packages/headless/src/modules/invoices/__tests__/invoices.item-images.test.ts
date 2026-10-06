/**
 * @fileoverview invoices — the catalogue image and billing cycle of an item
 *
 * ## Job To Be Done
 * Prove how an order item reads its image and its billing cycle (design 8.7):
 * the catalogue image read wins, a failed or empty image read keeps the
 * product's own image, and an item whose billing cycles have not resolved has
 * no billing cycle yet rather than a wrong one.
 *
 * ## What Breaks If These Fail
 * A failed image read blanks every item picture, the item shows a stale
 * product image over the catalogue one, or an order shows a billing-cycle name
 * before the cycles have loaded.
 */

import { describe, expect, it } from "vitest";
import billingCyclesRecording from "../../system/__tests__/fixtures/get-billing-cycles.json";
import { mapInvoiceItems } from "../invoices.mappers";
import orderRecording from "./scenarios/see-the-catalogue-image-of-each-item-i-ordered/02/get-invoices-id-with-staged-imports-1.json";
import imagesRecording from "./scenarios/see-the-catalogue-image-of-each-item-i-ordered/02/get-products-filter-id.json";
import { fromPairs, map } from "lodash-es";
import type { IBillingCycle, IInvoice } from "@upmind-automation/types";

type RecordedItem = {
  product: { id: string; image?: { full_url?: string } | null };
};

const recordedOrder = (
  orderRecording as unknown as { response: { body: { data: IInvoice } } }
).response.body.data;

const snapshot = (
  recordedOrder as unknown as {
    current_data: { content: { products: RecordedItem[] } };
  }
).current_data.content.products;

/** The catalogue image read, as `{ productId -> full_url }`. */
const catalogue: Record<string, string> = fromPairs(
  map(
    (
      imagesRecording as unknown as {
        response: {
          body: { data: Array<{ id: string; image: { full_url: string } }> };
        };
      }
    ).response.body.data,
    row => [row.id, row.image.full_url]
  )
);

const billingCycles = (
  billingCyclesRecording as unknown as {
    response: { body: { data: IBillingCycle[] } };
  }
).response.body.data;

/** The recorded order with each snapshot item's own product image removed. */
const withoutProductImages = {
  ...recordedOrder,
  current_data: {
    content: {
      products: map(snapshot, item => ({
        ...item,
        product: { ...item.product, image: null }
      }))
    }
  }
} as unknown as IInvoice;

// FE-3237 AC16
describe("AC-33: the image and the billing cycle of an item", () => {
  it("shows the catalogue image of each item the image read returned", () => {
    const items = mapInvoiceItems(withoutProductImages, {
      billingCycles,
      imageMap: catalogue
    });
    expect(map(items, "image")).toEqual(
      map(snapshot, item => catalogue[item.product.id])
    );
  });

  it("keeps the product's own image when the image read failed", () => {
    const items = mapInvoiceItems(recordedOrder, {
      billingCycles,
      imageMap: {}
    });
    expect(map(items, "image")).toEqual(
      map(snapshot, item => item.product.image?.full_url)
    );
  });

  it("shows no image when neither read holds one", () => {
    const items = mapInvoiceItems(withoutProductImages, {
      billingCycles,
      imageMap: {}
    });
    expect(map(items, "image")).toEqual(map(snapshot, () => undefined));
  });

  it("leaves the billing cycle unset until the cycles resolve", () => {
    const items = mapInvoiceItems(recordedOrder, {
      billingCycles: undefined as unknown as IBillingCycle[],
      imageMap: catalogue
    });
    expect(map(items, "billingCycle")).toEqual(map(snapshot, () => undefined));
  });
});
