// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The read/configure API boundary, driven from the product route
 *
 * ## Job To Be Done
 * On the product route, the organism reads that product's resources and shows the API's answer.
 *
 * ## What Breaks If These Fail
 * A customer configures a product other than the one they clicked, or the provision fields never arrive.
 */

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  bootAt,
  capturedMessages,
  readableText,
  seedBasket,
  seedGuestSession
} from "./mount-configure";
import {
  installBootRoutes,
  otherProductId,
  recordedBasketProductId,
  recordedDisplayPrice,
  recordedFieldLabels,
  recordedProductId,
  recordedProductName,
  server
} from "./recorded-pool";
import type { ConfigureWrapper } from "./mount-configure";

// -----------------------------------------------------------------------------

const productId = recordedProductId as string;
const BOOT_TIMEOUT = 60000;

let outbound: string[] = [];

server?.events.on("request:start", ({ request }) => {
  const url = new URL(request.url);
  outbound.push(`${request.method} ${url.pathname}${url.search}`);
});

function productCalls() {
  return outbound.filter(entry =>
    /\/api\/(basket\/(products\/|[^/]+\/products\/)|orders\/[^/]+\/products\/)/.test(
      entry
    )
  );
}

function detailReads() {
  return productCalls().filter(entry => !entry.includes("provision_fields"));
}

function fieldCalls() {
  return productCalls().filter(entry => entry.includes("provision_fields"));
}

function namesTheAskedProduct(entry: string) {
  return (
    entry.includes(productId) || entry.includes(String(recordedBasketProductId))
  );
}

const showsProduct = (wrapper: ConfigureWrapper) =>
  readableText(wrapper).includes(recordedProductName as string);

// -----------------------------------------------------------------------------

describe("the read/configure boundary, given a product route", () => {
  beforeAll(async () => {
    installBootRoutes();
    await seedGuestSession();
    await seedBasket();

    await bootAt(productId, showsProduct);
  }, BOOT_TIMEOUT);

  beforeEach(() => {
    outbound = [];
    installBootRoutes();
  });

  it(
    "goes to the named product's own resources, and to no others",
    async () => {
      await bootAt(productId, showsProduct);

      const reads = detailReads();
      const fields = fieldCalls();
      const stray = reads.filter(entry => !namesTheAskedProduct(entry));

      expect(
        reads.length,
        `never read a product at all: ${outbound.join("\n  ")}`
      ).toBeGreaterThan(0);
      expect(
        stray,
        `read a product the route never named: ${stray.join("\n  ")}`
      ).toEqual([]);
      expect(
        reads.filter(entry => entry.includes(String(otherProductId))),
        "read the other product in the same basket, which nobody asked for"
      ).toEqual([]);

      for (const relation of ["prices", "products_options", "image"]) {
        expect(
          reads[0],
          `read without ${relation}, so the surface cannot draw it`
        ).toContain(relation);
      }

      expect(
        fields.length,
        `never asked what the product needs configuring: ${outbound.join("\n  ")}`
      ).toBeGreaterThan(0);
      expect(
        fields.filter(namesTheAskedProduct).length,
        `asked for fields, but never this product's: ${fields.join("\n  ")}`
      ).toBeGreaterThan(0);

      const destructive = outbound.filter(entry =>
        /^(PUT|DELETE) .*\/api\/(basket|orders)\//.test(entry)
      );
      expect(
        destructive,
        `changed the customer's basket on a read: ${destructive.join("\n  ")}`
      ).toEqual([]);
    },
    BOOT_TIMEOUT
  );

  it(
    "puts the product the API named in front of the customer",
    async () => {
      const { wrapper } = await bootAt(productId, showsProduct);

      expect(
        readableText(wrapper),
        "the recorded product's name never reached the screen"
      ).toContain(recordedProductName);
    },
    BOOT_TIMEOUT
  );

  it(
    "shows the figure the API formatted, never one it computed itself",
    async () => {
      const { wrapper } = await bootAt(productId, showsProduct);

      expect(readableText(wrapper)).toContain(recordedDisplayPrice);
    },
    BOOT_TIMEOUT
  );

  it(
    "draws the configure fields the API returned",
    async () => {
      const { wrapper } = await bootAt(productId, showsProduct);

      const shown = readableText(wrapper);
      const drawn = recordedFieldLabels.filter(label => shown.includes(label));

      expect(
        drawn.length,
        `none of the recorded provision fields reached the form; expected one ` +
          `of ${recordedFieldLabels.slice(0, 6).join(", ")}`
      ).toBeGreaterThan(0);
    },
    BOOT_TIMEOUT
  );

  it(
    "renders something a customer can read, not an empty page",
    async () => {
      const harness = await bootAt(productId, showsProduct);

      expect(readableText(harness.wrapper).length).toBeGreaterThan(20);
      expect(
        harness.wrapper.find('[data-test-key="configure-pending"]').exists(),
        "still on the Suspense fallback when the boot chain had settled"
      ).toBe(false);
      expect(
        capturedMessages(harness),
        "the settled surface threw while rendering"
      ).toEqual([]);
    },
    BOOT_TIMEOUT
  );

  it(
    "reports the product to its host through the published emit",
    async () => {
      const { wrapper } = await bootAt(productId, showsProduct);

      const organism = wrapper.findComponent({ name: "Configure" });
      const details = organism.emitted("productDetails") as
        | Array<[{ title?: string }]>
        | undefined;

      expect(
        details,
        `the host was never told which product this is: ${Object.keys(
          organism.emitted()
        ).join(", ")}`
      ).toBeTruthy();
      expect(details?.[0]?.[0]?.title).toBe(recordedProductName);
    },
    BOOT_TIMEOUT
  );
});
