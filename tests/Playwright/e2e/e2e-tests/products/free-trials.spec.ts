import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Basket } from "../../support/page-objects/templates/basket";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { goToCheckout } from "../../support/flows/checkout";
import { mockTrialProduct } from "../../support/mocks/products";
import {
  getSessionToken,
  registerClient,
  createOrder,
  addProductToOrder,
  getClientToken,
  addPromotionToOrder,
  getCurrentOrder
} from "../../support/api/index";
import { waitForSessionCookie } from "../../support/helpers/session";

let productConfig: ProductConfig;
let basket: Basket;
let checkout: Checkout;

const trialButtonId = "button-try-free-for-7-days";
const trialPeriod = "7 days";

test.describe("Free Trials @free-trials", () => {
  test.describe("Product Config — Optional Trial", () => {
    test.beforeEach(async ({ page }) => {
      productConfig = new ProductConfig(page);
      await page.goto(URLs.optionalTrialProduct);
      await waitForSessionCookie(page.context());
    });
    test("1.1 Trial checkbox visible & pre-selected for trial-supported product", async () => {
      await expect(productConfig.trialCheckbox).toBeVisible();
      const checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(true);
    });
    test("1.2 Trial description shows badge, duration and term", async () => {
      await expect(productConfig.trialBadge).toBeVisible();
      await expect(productConfig.trialBadge).toContainText("Free Trial");
      await expect(productConfig.trialDescription).toBeVisible();
      await expect(productConfig.trialDescription).toContainText(
        `Good news—you can now try this product free for ${trialPeriod}, no strings attached. After your trial period ends, your plan will then begin.`
      );
    });
    test("1.3 User can deselect trial (opt out)", async () => {
      // Start selected
      let checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(true);
      // Deselect
      await productConfig.toggleTrial();
      checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(false);
    });
    test("1.4 User can re-select trial (opt back in)", async () => {
      // Deselect first
      await productConfig.toggleTrial();
      let checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(false);
      // Re-select
      await productConfig.toggleTrial();
      checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(true);
    });
    test("1.5 Promo details display on trial product", async ({
      page,
      context
    }) => {
      const token = await getSessionToken(context);
      const order = await createOrder(token);
      let orderId = order.id;
      await addPromotionToOrder(orderId, "genericpromo", token);
      await page.reload();
      await expect(productConfig.trialCheckbox).toBeVisible();
      await expect(page.getByTestId("badge").first()).toHaveText("Save 20%");
    });
  });
  test.describe("Product Config — Forced Trial", () => {
    test.beforeEach(async ({ page }) => {
      productConfig = new ProductConfig(page);
      await page.goto(URLs.forcedTrialProduct);
      await waitForSessionCookie(page.context());
    });
    test("2.1 Trial checkbox visible but disabled", async () => {
      await expect(productConfig.trialCheckbox).toBeVisible();
      await expect(productConfig.trialCheckbox).toBeDisabled();
      let checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(true);
    });
    test("2.2 Trial description shows badge, duration and term", async () => {
      await expect(productConfig.trialBadge).toBeVisible();
      await expect(productConfig.trialBadge).toContainText("Free Trial");
      await expect(productConfig.trialDescription).toBeVisible();
      await expect(productConfig.trialDescription).toContainText(
        `Good news—you can now try this product free for ${trialPeriod}, no strings attached. After your trial period ends, your plan will then begin.`
      );
    });
  });
  test.describe("Product Config — Non-Trial Product", () => {
    test("3.1 No trial checkbox for non-trial product", async ({ page }) => {
      productConfig = new ProductConfig(page);
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(page.context());
      await expect(productConfig.trialCheckbox).toBeHidden();
    });
  });
  test.describe("Product Card — Catalogue & Recommendations", () => {
    test("4.1 'Free Trial' badge on product card", async ({ page }) => {
      await page.goto(URLs.freeTrialsCategory);
      await waitForSessionCookie(page.context());
      await expect(
        page.getByTestId("badge").filter({ hasText: "Free Trial" }).first()
      ).toBeVisible();
    });
    test("4.2 CTA button shows 'Try free for X days'", async ({ page }) => {
      await page.goto(URLs.freeTrialsCategory);
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId(trialButtonId).first()).toBeVisible();
    });
    test("4.3 No trial badge on non-trial product", async ({ page }) => {
      mockTrialProduct(page.context(), "/api/basket/products?", {
        trialSupported: false,
        trialDuration: 7
      });
      await page.goto(URLs.catalogueRoot1);
      await waitForSessionCookie(page.context());
      await expect(
        page.getByTestId("badge").filter({ hasText: "Free Trial" })
      ).toHaveCount(0);
    });
    test("4.4 Adding from card enables trial automatically", async ({
      page
    }) => {
      productConfig = new ProductConfig(page);
      basket = new Basket(page);
      await page.goto(URLs.freeTrialsCategory);
      const trialButton = page.getByTestId(trialButtonId).first();
      await trialButton.click();
      await expect(productConfig.productConfigSection).toBeVisible();
      await expect(productConfig.trialCheckbox).toBeVisible();
      let checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(true);
    });
  });
  test.describe("Recommendations", () => {
    test("5.1 Free Trials display on Recommendations page", async ({
      page
    }) => {
      //TODO
    });
    test("5.2 Free Trials display on Recommendations page", async ({
      page
    }) => {
      //TODO
    });
  });
  test.describe("Basket Display with Trial", () => {
    test.beforeEach(async ({ page, context }) => {
      basket = new Basket(page);
      mockTrialProduct(page.context(), "/api/basket/products/", {
        trialSupported: true,
        trialDuration: 7
      });
      await page.goto("/");
      await waitForSessionCookie(context);
      const token = await getSessionToken(context);
      const order = await createOrder(token);
      const orderId = order.id;
      await addProductToOrder(
        token,
        orderId,
        products.OPTIONAL_TRIAL_PRODUCT.id,
        1,
        products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
        [],
        [],
        {},
        [],
        true,
        true
      );
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
    });
    test("6.1 'Free Trial' shown instead of price", async () => {
      await expect(basket.trialPriceLabel).toBeVisible();
    });
    test("6.2 Trial alert visible", async () => {
      await expect(basket.trialAlert).toBeVisible();
      await expect(basket.trialAlert).toContainText("free trial");
    });

    test("6.3 Renewal price shown", async () => {
      await expect(basket.basketProductSummary.locator("footer")).toContainText(
        "Renews every year."
      );
      await expect(basket.basketProductSummary.locator("footer")).toContainText(
        "Usually £10.00."
      );
      await expect(basket.basketProductSummary.locator("footer")).toContainText(
        "Free Trial"
      );
    });
  });
  test.describe("Checkout with Trial Product", () => {
    test.beforeEach(async ({ page, context }) => {
      checkout = new Checkout(page);
      await page.goto("/");
      await waitForSessionCookie(context);
      let guestToken = await getSessionToken(context);
      let user = await registerClient(guestToken);
      let username = user.email;
      let password = user.password;
      await getClientToken(page, username, password);
      await goToCheckout(
        page,
        context,
        products.OPTIONAL_TRIAL_PRODUCT,
        null,
        null,
        true
      );
      await page.reload();
    });
    test("7.1 Trial shows as free in checkout summary", async ({ page }) => {
      await expect(checkout.basketSummary).toBeVisible();
      await expect(
        page
          .getByTestId("description-list-item-trial-product-optional")
          .getByText("£0.00")
      ).toBeVisible();
    });
    test("7.2 Zero-amount checkout displays for trial-only order", async ({
      page
    }) => {
      await expect(checkout.basketSummary).toBeVisible();
      await expect(
        page.getByText("Great news – there's nothing to pay!")
      ).toBeVisible();
      // For a zero-amount order (free trial), the button should say
      // "Place Order" instead of "Place Order and Pay"
      await expect(checkout.placeOrder).toBeVisible();
    });
  });
});
