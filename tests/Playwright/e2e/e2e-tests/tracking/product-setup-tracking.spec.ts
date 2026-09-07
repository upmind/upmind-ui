import { test, expect, type Page } from "@playwright/test";

import { URLs } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { Basket } from "../../support/page-objects/templates/basket";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { ProductSetup } from "../../support/page-objects/templates/product-setup";

import {
  addBillingAddressViaHeadless,
  fillRegistrantDetails,
  registerClientViaHeadless,
  seedInvalidProduct
} from "../../support/flows";
import { getDataLayer, waitForEvent } from "../../support/helpers/gtm";
import type { AddressModel } from "@upmind-automation/headless";

// NB: no `name` — a `name` on the model triggers the Google address-search
// path, which asynchronously re-derives the address and clobbers these fields.
const SEEDED_ADDRESS: AddressModel = {
  address: {
    address1: "10 Downing Street",
    address2: "",
    city: "London",
    countryId: "320e4357-95e7-8d18-484f-31643202d986",
    postcode: "SW1A 2AB",
    regionId: "de78642d-e539-7146-295f-21208469530d"
  }
};

// A fresh client with a billing address but no phone IS the incomplete customer
// these steps need; the shared Logins.domain1 account raced the domain-customers
// journeys on the same basket.
async function bootIncompleteCustomer(page: Page) {
  await page.goto(URLs.baseUrl);
  const { id } = await registerClientViaHeadless(page);
  await seedInvalidProduct(page, products.DOMAIN_2);
  await page.goto(URLs.basket);
  await addBillingAddressViaHeadless(page, id, SEEDED_ADDRESS);
}

// The exact dataLayer event names need to be confirmed against the running app.
// `useDataLayer().withEcommerce().push()` in Checkout.vue:174 fires
// `begin_checkout` after the new chain reaches /checkout/, which the tests
// below rely on as the load-bearing checkpoint.

let basket: Basket;
let productConfig: ProductConfig;
let productSetup: ProductSetup;

test.describe("Tracking — Product Setup step", () => {
  test.beforeEach(({ page }) => {
    basket = new Basket(page);
    productConfig = new ProductConfig(page);
    productSetup = new ProductSetup(page);
  });

  test("dataLayer captures a route-change event for the new PRODUCTS_SETUP path", async ({
    page
  }) => {
    await bootIncompleteCustomer(page);

    await page.goto(`${URLs.baseUrl}order/basket/products-setup/`);
    await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });

    const dataLayer = await getDataLayer(page);
    const setupEvents = (dataLayer ?? []).filter(entry =>
      JSON.stringify(entry).includes("products-setup")
    );
    expect(setupEvents.length).toBeGreaterThan(0);
  });

  test("dataLayer fires a checkout-progression event on submission", async ({
    page
  }) => {
    await bootIncompleteCustomer(page);
    // Reach the setup step the way a shopper does — through Proceed — so the
    // funnel runs its provision-field check against the committed address
    // (a direct deep link shows stale required errors and a disabled Continue).
    await basket.proceedToCheckout.click();
    await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });

    await fillRegistrantDetails(productConfig);
    await productSetup.submit();
    // Gateway-independent checkout-arrival signal. button-complete-checkout
    // only mounts once a gateway/stored method is selected (usePaymentDetail
    // showPaymentActions), which these tracking tests never do — so gate on the
    // navigation to /checkout/ instead. begin_checkout fires on checkout mount
    // regardless of gateway selection, and the waitForEvent poll below tolerates
    // it landing just after the URL settles.
    await page.waitForURL(/checkout/);

    // GTM fires begin_checkout on checkout mount, just after navigation settles —
    // poll for it rather than reading the dataLayer once (timing race).
    const beginCheckout = await waitForEvent(page, "begin_checkout");
    expect(beginCheckout).toBeDefined();
  });

  test("no dataLayer events reference the removed BASKET_PRODUCT_REQUIRES_ACTION route", async ({
    page
  }) => {
    await bootIncompleteCustomer(page);
    await basket.proceedToCheckout.click();
    await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
    await fillRegistrantDetails(productConfig);
    await productSetup.submit();
    // Gateway-independent checkout-arrival signal. button-complete-checkout
    // only mounts once a gateway/stored method is selected (usePaymentDetail
    // showPaymentActions), which these tracking tests never do — so gate on the
    // navigation to /checkout/ instead. begin_checkout fires on checkout mount
    // regardless of gateway selection, and the waitForEvent poll below tolerates
    // it landing just after the URL settles.
    await page.waitForURL(/checkout/);

    const dataLayer = await getDataLayer(page);
    const stale = (dataLayer ?? []).filter(entry => {
      const blob = JSON.stringify(entry);
      return (
        blob.includes("requires-action") ||
        blob.includes("BASKET_PRODUCT_REQUIRES_ACTION") ||
        blob.includes("basket-product-requires-action")
      );
    });
    expect(stale).toHaveLength(0);
  });

  test("apply-to-others does not double-fire submission events", async ({
    page
  }) => {
    await bootIncompleteCustomer(page);
    await seedInvalidProduct(page, products.DOMAIN_3);
    await basket.proceedToCheckout.click();
    await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
    await fillRegistrantDetails(productConfig);
    await productSetup.submit();
    // Gateway-independent checkout-arrival signal. button-complete-checkout
    // only mounts once a gateway/stored method is selected (usePaymentDetail
    // showPaymentActions), which these tracking tests never do — so gate on the
    // navigation to /checkout/ instead. begin_checkout fires on checkout mount
    // regardless of gateway selection, and the waitForEvent poll below tolerates
    // it landing just after the URL settles.
    await page.waitForURL(/checkout/);

    // Wait for the event to fire (timing race), then assert it fired exactly once.
    await waitForEvent(page, "begin_checkout");
    const dataLayer = await getDataLayer(page);
    const beginCheckoutEvents = (dataLayer ?? []).filter(
      entry => entry.event === "begin_checkout"
    );
    expect(beginCheckoutEvents.length).toBe(1);
  });
});
