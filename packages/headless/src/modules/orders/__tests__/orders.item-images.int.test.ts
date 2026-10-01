// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the item images come from the catalogue, in
 * a second read that does not block the order (AC-16, D-14)
 *
 * ## Job To Be Done
 * Prove the manager reads `GET api/products` once, with `filter[id]` set to
 * the unique catalogue product ids `item.product.id` of the snapshot lines,
 * never the line ids, `with=image` and `limit=<count>`; that each item shows
 * the recorded catalogue image; that the order publishes before that read
 * answers; that a refused read sets no error and keeps the product image;
 * and that no read leaves for an item list with no product id.
 *
 * ## Provenance
 * The recorded `order-snapshot` single read and the recorded `order-images`
 * read, each on its own recorded request. The refused read is injected at the
 * boundary with a 4xx, the recorded staging not-found envelope (design 8.8).
 * Declared construction (design 8.8, "product image"): the snapshot line with
 * `product.image.full_url` set to the brand image `full_url` of the same
 * capture, so the product image differs from the catalogue image. Under the
 * refused read the images capture answers no line.
 *
 * ## What Breaks If These Fail
 * The order view waits on images, shows no image, or asks the catalogue for
 * line ids that name no product.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useOrder } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  capture,
  captured,
  capturedOrder,
  observeModuleRequests,
  recordedMatch,
  seedClientSession,
  serveRecordedOrder,
  settle
} from "./orders.int-helpers";
import { server } from "./setup.integration";
import type { OrderEnvelope } from "./orders.int-helpers";

// -----------------------------------------------------------------------------

type Line = {
  id: string;
  product: { id: string; image?: { full_url?: string } };
};

const SNAPSHOT = capturedOrder("get-invoices-id-case-order-snapshot");
const LINES = (SNAPSHOT.data.current_data as { content: { products: Line[] } })
  .content.products;
const PRODUCT_IMAGE = (
  SNAPSHOT.data.current_data as {
    content: { brand: { image: { full_url: string } } };
  }
).content.brand.image.full_url;

function withProductImage(): OrderEnvelope {
  const data = structuredClone(SNAPSHOT.data) as Record<string, unknown> & {
    current_data: { content: { products: Line[] } };
  };
  data.current_data.content.products[0].product.image = {
    ...data.current_data.content.products[0].product.image,
    full_url: PRODUCT_IMAGE
  };
  return { ...SNAPSHOT, data };
}

const IMAGES = captured<{
  data: Array<{ id: string; image: { full_url: string } }>;
}>("get-products-case-order-images").data;

async function boot(
  envelope: OrderEnvelope,
  products?: Parameters<typeof http.get>[1]
) {
  await seedClientSession();
  serveRecordedOrder(envelope);
  if (products) server?.use(http.get("*/api/products", products));
  const observed = observeModuleRequests();
  const id = envelope.data.id as string;
  const manager = useOrder().as(ScopeActorTypes.SELF).withId(id);
  manager.useMeta();
  const imageReads = () =>
    observed
      .all()
      .filter(request => new URL(request.url).pathname === "/api/products");
  return { manager, imageReads, id };
}

// -----------------------------------------------------------------------------

describe("orders — the item images come from the catalogue (AC-16)", () => {
  it("the filter[id] csv equals the recorded product.id values of the snapshot items, and the first item shows its catalogue image", async () => {
    const { manager, imageReads } = await boot(withProductImage());
    await vi.waitFor(() => expect(imageReads()).toHaveLength(1));

    const params = new URL(imageReads()[0].url).searchParams;
    const productIds = [...new Set(LINES.map(line => line.product.id))];
    expect(params.get("filter[id]")?.split(",")).toEqual(productIds);
    expect(params.get("filter[id]")?.split(",")).not.toContain(LINES[0].id);
    expect(params.get("with")).toBe("image");
    expect(params.get("limit")).toBe(String(productIds.length));

    const catalogue = IMAGES.find(image => image.id === LINES[0].product.id);
    expect(catalogue?.image.full_url).toBeTruthy();
    expect(catalogue?.image.full_url).not.toBe(PRODUCT_IMAGE);
    await vi.waitFor(() =>
      expect(manager.useContext().products.value[0]?.image).toBe(
        catalogue?.image.full_url
      )
    );
  });

  it("the order publishes before the image read answers", async () => {
    let release: () => void = () => {};
    const held = new Promise<void>(resolve => {
      release = resolve;
    });
    const { manager, imageReads, id } = await boot(
      SNAPSHOT,
      async ({ request }) => {
        await held;
        const fixture = recordedMatch(
          ["get-products-case-order-images"],
          request
        );
        return fixture
          ? HttpResponse.json(fixture.response.body as object)
          : HttpResponse.error();
      }
    );

    await vi.waitFor(() => expect(imageReads()).toHaveLength(1));
    await vi.waitFor(() =>
      expect(manager.useContext().data.value?.id).toBe(id)
    );
    expect(manager.useMeta().isLoading.value).toBe(false);
    expect(manager.useContext().detail.value.id).toBe(id);
    expect(manager.useContext().products.value).toHaveLength(LINES.length);
    release();
  });

  it("a refused image read sets no error, and the item keeps its product image", async () => {
    const refusal = capture("get-invoices-id-case-order-not-found").response;
    const { manager, imageReads, id } = await boot(withProductImage(), () =>
      HttpResponse.json(refusal.body as object, { status: refusal.status })
    );

    await vi.waitFor(() => expect(imageReads()).toHaveLength(1));
    await vi.waitFor(() =>
      expect(manager.useContext().data.value?.id).toBe(id)
    );
    await settle();

    expect(manager.useContext().error.value).toBeUndefined();
    expect(manager.useMeta().hasError.value).toBe(false);
    expect(manager.useContext().products.value[0]?.image).toBe(PRODUCT_IMAGE);
  });

  it("an item list with no product id sends no image read", async () => {
    const data = structuredClone(SNAPSHOT.data) as Record<string, unknown> & {
      current_data: { content: { products: unknown[] } };
    };
    data.current_data.content.products = [];
    const { manager, imageReads, id } = await boot({ ...SNAPSHOT, data });

    await vi.waitFor(() =>
      expect(manager.useContext().data.value?.id).toBe(id)
    );
    await settle();
    expect(imageReads()).toEqual([]);
  });
});
