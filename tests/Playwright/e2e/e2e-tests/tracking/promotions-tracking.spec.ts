import { test, expect, Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";

import { products } from "../../support/constants/products";
import {
  addProductViaHeadless,
  addPromotionViaHeadless,
  removeProductViaHeadless
} from "../../support/flows";
import { getDataLayer, waitForEvent } from "../../support/helpers/gtm";

// FE-2317 made `ecommerce.items[].discount` include coupon discounts on the
// `add_to_cart` / `remove_from_cart` dataLayer events. The mapper that feeds
// those events (`mapBasketProduct` in headless system-analytics.utils) reads
// `product.price.configuration.discount`, so a coupon-discounted basket product
// must surface a positive `discount` on both events. The rest of the tracking
// suite asserts other events but never reads the dataLayer during a promotion
// flow — a regression that silently returned the item discount to zero would
// pass unnoticed. These two slices close that gap.
//
// Mock policy (ADR 021 P4): a REAL staging promotion is applied through the
// live basket module (never `mockPromos`, which only fakes badge display). The
// expected discount is derived from the live basket the app renders from, never
// a hardcoded currency literal.

// Generic staging promotion, confirmed to discount STARTER_HOSTING elsewhere in
// the promotions suite (applied for real at checkout/confirmation).
const PROMO_CODE = "genericpromo";

const randomDomain = () =>
  `${fakerEN_GB.string.alphanumeric({ length: 15 })}.com`;

interface EcommerceItem {
  discount?: number;
  item_id?: string;
}

interface CartEvent {
  event?: string;
  ecommerce?: { items?: EcommerceItem[] };
}

/**
 * Reads a single basket product's live coupon discount — the exact value
 * `mapBasketProduct` pushes onto the dataLayer item — straight from the app's
 * basket singleton, so assertions are anchored to real API state.
 */
async function readProductDiscount(page: Page, bpid: string): Promise<number> {
  return page.evaluate(id => {
    const items = window.Upmind?.useBasket().products.value ?? [];
    const match = items.find(product => product.id === id);
    return match?.price?.configuration?.discount ?? 0;
  }, bpid);
}

/**
 * Sums the coupon discount across every product in the live basket. Used to
 * bound an event's item discount by real API state without hardcoding a figure.
 */
async function readBasketDiscountTotal(page: Page): Promise<number> {
  return page.evaluate(() => {
    const items = window.Upmind?.useBasket().products.value ?? [];
    return items.reduce(
      (total, product) =>
        total + (product?.price?.configuration?.discount ?? 0),
      0
    );
  });
}

/** All `event`-named entries currently on the dataLayer, oldest first. */
async function cartEvents(page: Page, event: string): Promise<CartEvent[]> {
  const dataLayer = (await getDataLayer(page)) ?? [];
  return dataLayer.filter(entry => entry.event === event) as CartEvent[];
}

test.describe("Tracking — coupon discount in cart events (FE-2317)", () => {
  // serial: both slices drive the shared guest basket on staging; running them
  // concurrently would let one slice's add/remove pollute the other's dataLayer.
  test.describe.configure({ mode: "serial" });

  test("add_to_cart carries the coupon discount on ecommerce.items", async ({
    page
  }) => {
    await page.goto("/");

    // Seed a first qualifying product, then apply the real promotion to the
    // basket (a promo cannot attach to an empty basket).
    await addProductViaHeadless(page, {
      productId: products.STARTER_HOSTING.id,
      billingCycleMonths: products.STARTER_HOSTING.billingCycle,
      provisionFields: { domain: randomDomain() }
    });
    await addPromotionViaHeadless(page, PROMO_CODE);

    // The promotion is applied asynchronously; wait until the live basket
    // actually carries a coupon discount before relying on it.
    await expect
      .poll(() => readBasketDiscountTotal(page), { timeout: 30000 })
      .toBeGreaterThan(0);

    // Count add_to_cart events already fired (the pre-promo seed fired one with
    // zero discount) so we can wait for the NEXT one specifically.
    const before = (await cartEvents(page, "add_to_cart")).length;

    // Adding a second qualifying product while the coupon is live fires a fresh
    // add_to_cart whose item must carry the coupon discount (the FE-2317 path).
    await addProductViaHeadless(page, {
      productId: products.STARTER_HOSTING.id,
      billingCycleMonths: products.STARTER_HOSTING.billingCycle,
      provisionFields: { domain: randomDomain() }
    });

    await expect
      .poll(async () => (await cartEvents(page, "add_to_cart")).length, {
        timeout: 30000
      })
      .toBeGreaterThan(before);

    const addEvents = await cartEvents(page, "add_to_cart");
    const item = addEvents.at(-1)?.ecommerce?.items?.[0];
    expect(item).toBeDefined();

    // Core FE-2317 guard: the coupon discount reaches the event and is not
    // silently zero. Bounded by the live basket's total discount so the value
    // is proven to originate from real API state, not a hardcoded amount.
    const liveTotal = await readBasketDiscountTotal(page);
    expect(item?.discount).toBeGreaterThan(0);
    expect(item?.discount).toBeLessThanOrEqual(liveTotal);
  });

  test("remove_from_cart carries the coupon discount on ecommerce.items", async ({
    page
  }) => {
    await page.goto("/");

    const { basketProductId } = await addProductViaHeadless(page, {
      productId: products.STARTER_HOSTING.id,
      billingCycleMonths: products.STARTER_HOSTING.billingCycle,
      provisionFields: { domain: randomDomain() }
    });
    expect(basketProductId).not.toBeNull();

    await addPromotionViaHeadless(page, PROMO_CODE);

    // Wait for the promotion to discount this specific product, then capture
    // that live discount as the API-derived expected value for the event.
    await expect
      .poll(() => readProductDiscount(page, basketProductId as string), {
        timeout: 30000
      })
      .toBeGreaterThan(0);
    const expectedDiscount = await readProductDiscount(
      page,
      basketProductId as string
    );

    // Removing the discounted product fires remove_from_cart with the product
    // captured before removal — its item discount must equal what the basket
    // carried (FE-2317), not a reset-to-zero.
    await removeProductViaHeadless(page, basketProductId as string);

    const removeEvent = (await waitForEvent(
      page,
      "remove_from_cart"
    )) as CartEvent;
    const item = removeEvent.ecommerce?.items?.[0];
    expect(item).toBeDefined();
    expect(item?.discount).toBeGreaterThan(0);
    expect(item?.discount).toBe(expectedDiscount);
  });
});
