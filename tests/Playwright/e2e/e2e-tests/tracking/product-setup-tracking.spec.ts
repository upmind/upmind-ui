import { test, expect } from "@playwright/test";

import { URLs } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { Basket } from "../../support/page-objects/templates/basket";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { ProductSetup } from "../../support/page-objects/templates/product-setup";

import {
  fillRegistrantDetails,
  loginAsIncompleteCustomer,
  seedInvalidProduct
} from "../../support/flows";
import { getDataLayer, waitForEvent } from "../../support/helpers/gtm";

// The exact dataLayer event names need to be confirmed against the running app.
// `useDataLayer().withEcommerce().push()` in Checkout.vue:174 fires
// `begin_checkout` after the new chain reaches /checkout/, which the tests
// below rely on as the load-bearing checkpoint.

let basket: Basket;
let productConfig: ProductConfig;
let productSetup: ProductSetup;

test.describe("Tracking — Product Setup step", () => {
  // serial because every test logs into the shared Logins.domain1 account
  // (loginAsIncompleteCustomer); a logged-in account must not be exercised by
  // concurrent tests or they pollute each other's basket.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(({ page }) => {
    basket = new Basket(page);
    productConfig = new ProductConfig(page);
    productSetup = new ProductSetup(page);
  });

  test("dataLayer captures a route-change event for the new PRODUCTS_SETUP path", async ({
    page
  }) => {
    await loginAsIncompleteCustomer(page);
    await seedInvalidProduct(page, products.DOMAIN_2);

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
    await loginAsIncompleteCustomer(page);
    await seedInvalidProduct(page, products.DOMAIN_2);
    await page.goto(`${URLs.baseUrl}order/basket/products-setup/`);
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
    await loginAsIncompleteCustomer(page);
    await seedInvalidProduct(page, products.DOMAIN_2);

    await page.goto(URLs.basket);
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
    await loginAsIncompleteCustomer(page);
    await seedInvalidProduct(page, products.DOMAIN_2);
    await seedInvalidProduct(page, products.DOMAIN_3);

    await page.goto(URLs.basket);
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
