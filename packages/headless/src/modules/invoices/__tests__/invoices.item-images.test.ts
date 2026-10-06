// @vitest-environment happy-dom
/**
 * @fileoverview invoices — the catalogue image and billing cycle of an item
 *
 * ## Job To Be Done
 * Prove how an order item reads its image and its billing cycle (design 8.7,
 * 8.11): the catalogue image read wins, a failed or pending image read keeps
 * the product's own image, an item whose billing cycles have not resolved has
 * no billing cycle yet rather than a wrong one, and neither read blocks the
 * order or turns into an order error.
 *
 * ## What Breaks If These Fail
 * A failed image read blanks every item picture or fails the whole order, a
 * slow catalogue or billing-cycle read holds the order back, the item shows a
 * stale product image over the catalogue one, or an order shows a
 * billing-cycle name before the cycles have loaded.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import {
  replayStep,
  startScenarioReplay
} from "@upmind-automation/test-fixtures/replay-server";
import { useInvoice } from "..";
import { queryClient } from "../../query/client";
import billingCyclesRecording from "../../system/__tests__/fixtures/get-billing-cycles.json";
import { mapInvoiceItems } from "../invoices.mappers";
import { resetInvoiceScopes, seedClientSession } from "./invoices.int-helpers";
import orderRecording from "./scenarios/see-the-catalogue-image-of-each-item-i-ordered/02/get-invoices-id-with-staged-imports-1.json";
import imagesRecording from "./scenarios/see-the-catalogue-image-of-each-item-i-ordered/02/get-products-filter-id.json";
import { server } from "./setup.integration";
import { fromPairs, map } from "lodash-es";
import type { IBillingCycle, IInvoice } from "@upmind-automation/types";

type RecordedItem = {
  product: { id: string; image?: { full_url?: string } | null };
};

const ORDER_STEP = join(
  import.meta.dirname,
  "scenarios/see-the-catalogue-image-of-each-item-i-ordered/02"
);

const recordedOrder = (
  orderRecording as unknown as { response: { body: { data: IInvoice } } }
).response.body.data;

const snapshot = (
  recordedOrder as unknown as {
    current_data: { content: { products: RecordedItem[] } };
  }
).current_data.content.products;

const productImages = map(snapshot, item => item.product.image?.full_url);

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

/** Opens the recorded order over its own recorded reads, signed in as its client. */
async function openRecordedOrder() {
  const replay = startScenarioReplay(server);
  await seedClientSession();
  replayStep(server, ORDER_STEP);
  return { replay };
}

/** Answers every image read and billing-cycle read with a server error, counting each. */
function failSideReads(): { images: () => number; cycles: () => number } {
  const served = { images: 0, cycles: 0 };
  const failure = () =>
    HttpResponse.json(
      { status: "error", data: null, error: { code: 500, message: "Error" } },
      { status: 500 }
    );
  server?.use(
    http.get("*/api/products", () => {
      served.images += 1;
      return failure();
    }),
    http.get("*/api/billing_cycles", () => {
      served.cycles += 1;
      return failure();
    })
  );
  return { images: () => served.images, cycles: () => served.cycles };
}

/** Holds every image read and billing-cycle read open until released. */
function holdSideReads(): {
  imagesStarted: Promise<void>;
  release: () => void;
} {
  let release = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  let started = () => {};
  const imagesStarted = new Promise<void>(resolve => {
    started = resolve;
  });
  server?.use(
    http.get("*/api/products", async () => {
      started();
      await gate;
      return HttpResponse.error();
    }),
    http.get("*/api/billing_cycles", async () => {
      await gate;
      return HttpResponse.error();
    })
  );
  return { imagesStarted, release };
}

afterEach(resetInvoiceScopes);

// FE-3237 AC16
describe("AC-33: the image and the billing cycle of an item", () => {
  it("keeps the product image and no billing cycle, with no order error, when both side reads fail", async () => {
    const { replay } = await openRecordedOrder();
    const failed = failSideReads();

    const order = useInvoice().withId(recordedOrder.id);
    await order.useActions().isReady();
    await vi.waitFor(
      () => {
        expect(failed.images()).toBeGreaterThan(0);
        expect(failed.cycles()).toBeGreaterThan(0);
        expect(queryClient.isFetching()).toBe(0);
      },
      { timeout: 20000 }
    );

    const items = order.useContext().items.value;
    expect(map(items, "image")).toEqual(productImages);
    expect(map(items, "billingCycle")).toEqual(map(snapshot, () => undefined));
    expect(order.useMeta().hasError.value).toBe(false);
    expect(replay.gaps()).toEqual([]);
  }, 30000);

  it("is ready while the image read is still pending", async () => {
    const { replay } = await openRecordedOrder();
    const held = holdSideReads();

    onTestFinished(held.release);

    const order = useInvoice().withId(recordedOrder.id);
    const ready = order
      .useActions()
      .isReady()
      .then(() => "ready" as const);
    await held.imagesStarted;
    const outcome = await Promise.race([
      ready,
      new Promise<"blocked">(resolve =>
        setTimeout(() => resolve("blocked"), 3000)
      )
    ]);

    expect(outcome).toBe("ready");
    expect(map(order.useContext().items.value, "image")).toEqual(productImages);
    expect(order.useMeta().hasError.value).toBe(false);
    expect(replay.gaps()).toEqual([]);
  }, 30000);

  it("shows the catalogue image of each item the image read returned", () => {
    const items = mapInvoiceItems(withoutProductImages, {
      billingCycles,
      imageMap: catalogue
    });
    expect(map(items, "image")).toEqual(
      map(snapshot, item => catalogue[item.product.id])
    );
  });

  it("shows no image when neither read holds one", () => {
    const items = mapInvoiceItems(withoutProductImages, {
      billingCycles,
      imageMap: {}
    });
    expect(map(items, "image")).toEqual(map(snapshot, () => undefined));
  });
});
