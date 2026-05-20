import { newUser, expect } from "../../support/fixtures/index";
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
  addPromotionToOrder
} from "../../support/api/index";
import { waitForSessionCookie } from "../../support/helpers/session";

let productConfig: ProductConfig;
let basket: Basket;
let checkout: Checkout;

const trialButtonId = "button-try-free-for-7-days";
const trialPeriod = "7 days";

newUser.describe.configure({ mode: "parallel" });
newUser.describe("Free Trials @free-trials", () => {
  newUser.describe("Product Config — Optional Trial", () => {
    newUser.beforeEach(async ({ page }) => {
      productConfig = new ProductConfig(page);
      await page.goto(URLs.optionalTrialProduct);
      await waitForSessionCookie(page.context());
    });
    newUser(
      "Trial checkbox visible & pre-selected for trial-supported product",
      async () => {
        await expect(productConfig.trialCheckbox).toBeVisible();
        const checked = await productConfig.isTrialSelected();
        await expect(checked).toBe(true);
      }
    );
    newUser("Trial description shows badge, duration and term", async () => {
      await expect(productConfig.trialBadge).toBeVisible();
      await expect(productConfig.trialBadge).toContainText("Free Trial");
      await expect(productConfig.trialDescription).toBeVisible();
      await expect(productConfig.trialDescription).toContainText(
        `Good news—you can now try this product free for ${trialPeriod}, no strings attached. After your trial period ends, your plan will then begin.`
      );
    });
    newUser("User can deselect trial (opt out)", async () => {
      // Start selected
      let checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(true);
      // Deselect
      await productConfig.toggleTrial();
      checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(false);
    });
    newUser("User can re-select trial (opt back in)", async () => {
      // Deselect first
      await productConfig.toggleTrial();
      let checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(false);
      // Re-select
      await productConfig.toggleTrial();
      checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(true);
    });
    newUser(
      "Promo details display on trial product",
      async ({ page, context, token }) => {
        const order = await createOrder(token);
        let orderId = order.id;
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
        await addPromotionToOrder(orderId, "genericpromo", token);
        await page.goto(URLs.optionalTrialProduct);
        await expect(productConfig.trialCheckbox).toBeVisible();
        await expect(page.getByTestId("badge").nth(1)).toHaveText("Save 20%");
      }
    );
  });
  newUser.describe("Product Config — Forced Trial", () => {
    newUser.beforeEach(async ({ page }) => {
      productConfig = new ProductConfig(page);
      await page.goto(URLs.forcedTrialProduct);
      await waitForSessionCookie(page.context());
    });
    newUser("Trial checkbox visible but disabled", async () => {
      await expect(productConfig.trialCheckbox).toBeVisible();
      await expect(productConfig.trialCheckbox).toBeDisabled();
      let checked = await productConfig.isTrialSelected();
      await expect(checked).toBe(true);
    });
    newUser("Trial description shows badge, duration and term", async () => {
      await expect(productConfig.trialBadge).toBeVisible();
      await expect(productConfig.trialBadge).toContainText("Free Trial");
      await expect(productConfig.trialDescription).toBeVisible();
      await expect(productConfig.trialDescription).toContainText(
        `Good news—you can now try this product free for ${trialPeriod}, no strings attached. After your trial period ends, your plan will then begin.`
      );
    });
  });
  newUser.describe("Product Config — Non-Trial Product", () => {
    newUser("No trial checkbox for non-trial product", async ({ page }) => {
      productConfig = new ProductConfig(page);
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(page.context());
      await expect(productConfig.trialCheckbox).toBeHidden();
    });
  });
  newUser.describe("Product Card — Catalogue & Recommendations", () => {
    newUser("'Free Trial' badge on product card", async ({ page }) => {
      await page.goto(URLs.freeTrialsCategory);
      await waitForSessionCookie(page.context());
      await expect(
        page.getByTestId("badge").filter({ hasText: "Free Trial" }).first()
      ).toBeVisible();
    });
    newUser("CTA button shows 'Try free for X days'", async ({ page }) => {
      await page.goto(URLs.freeTrialsCategory);
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId(trialButtonId).first()).toBeVisible();
    });
    newUser("No trial badge on non-trial product", async ({ page }) => {
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
    newUser(
      "Adding from card enables trial automatically",
      async ({ page }) => {
        productConfig = new ProductConfig(page);
        basket = new Basket(page);
        await page.goto(URLs.freeTrialsCategory);
        const trialButton = page.getByTestId(trialButtonId).first();
        await trialButton.click();
        await expect(productConfig.productConfigSection).toBeVisible();
        await expect(productConfig.trialCheckbox).toBeVisible();
        let checked = await productConfig.isTrialSelected();
        await expect(checked).toBe(true);
      }
    );
  });
  newUser.describe("Recommendations", () => {
    newUser("Free Trials display on Recommendations page", async ({ page }) => {
      //TODO
    });
    newUser("Free Trials display on Recommendations page", async ({ page }) => {
      //TODO
    });
  });
  newUser.describe("Basket Display with Trial", () => {
    newUser.beforeEach(async ({ page, context }) => {
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
    newUser("'Free Trial' shown instead of price", async () => {
      await expect(basket.trialPriceLabel).toBeVisible();
    });
    newUser("Trial alert visible", async () => {
      await expect(basket.trialAlert).toBeVisible();
      await expect(basket.trialAlert).toContainText("free trial");
    });

    newUser("Renewal price shown", async () => {
      await expect(basket.basketProductSummary.locator("footer")).toContainText(
        "Renews every year."
      );
      await expect(basket.basketProductSummary.locator("footer")).toContainText(
        "Usually £10.00."
      );
      // Since FE-2654 "Free Trial" lives in the header hgroup, not the footer,
      // so scope this assertion to the whole product summary instead.
      await expect(basket.basketProductSummary).toContainText("Free Trial");
    });
  });
  newUser.describe("Checkout with Trial Product", () => {
    newUser.beforeEach(async ({ page, context }) => {
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
    newUser("Trial shows as free in checkout summary", async ({ page }) => {
      await expect(checkout.basketSummary).toBeVisible();
      await expect(
        page
          .getByTestId("description-list-item-trial-product-optional")
          .getByText("£0.00")
      ).toBeVisible();
    });
    newUser(
      "Zero-amount checkout displays for trial-only order",
      async ({ page }) => {
        await expect(checkout.basketSummary).toBeVisible();
        await expect(
          page.getByText("Great news – there's nothing to pay!")
        ).toBeVisible();
        await expect(checkout.completeCheckout).toBeVisible();
        await expect(checkout.completeCheckout).toBeEnabled();
      }
    );
  });
});
