import { newUser, expect } from "../../support/fixtures/index";
import { URLs } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Basket } from "../../support/page-objects/templates/basket";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { goToCheckout } from "../../support/flows/checkout";
import {
  captureProduct,
  captureProducts,
  mockTrialProduct
} from "../../support/mocks/products";
import {
  getSessionToken,
  registerClient,
  createOrder,
  addProductToOrder,
  getClientToken,
  addPromotionToOrder
} from "../../support/api/index";
import {
  clickAndAwaitBasketAdd,
  waitForSessionCookie
} from "../../support/helpers";
import { interceptConfigValues } from "../../support/mocks/brand";

let productConfig: ProductConfig;
let basket: Basket;
let checkout: Checkout;

newUser.describe.configure({ mode: "parallel" });
newUser.describe("Free Trials @free-trials", () => {
  newUser.describe("Product Config — Optional Trial", () => {
    let productPromise: Promise<{ trial_duration: number }>;
    newUser.beforeEach(async ({ page }) => {
      productConfig = new ProductConfig(page);
      productPromise = captureProduct(page);
      await page.goto(URLs.optionalTrialProduct);
      await waitForSessionCookie(page.context());
    });
    newUser(
      "Trial checkbox visible & pre-selected for trial-supported product",
      async () => {
        await expect(productConfig.trialCheckbox).toBeVisible();
        await productConfig.expectTrialSelected();
      }
    );
    newUser("Trial description shows badge, duration and term", async () => {
      const { trial_duration } = await productPromise;
      await expect(productConfig.trialBadge).toBeVisible();
      await expect(productConfig.trialBadge).toContainText("Free Trial");
      await expect(productConfig.trialDescription).toBeVisible();
      await expect(productConfig.trialDescription).toContainText(
        `${trial_duration} day`
      );
    });
    newUser("User can deselect trial (opt out)", async () => {
      // Start selected
      await productConfig.expectTrialSelected();
      // Deselect
      await productConfig.toggleTrial();
      await productConfig.expectTrialNotSelected();
    });
    newUser("User can re-select trial (opt back in)", async () => {
      // Deselect first
      await productConfig.toggleTrial();
      await productConfig.expectTrialNotSelected();
      // Re-select
      await productConfig.toggleTrial();
      await productConfig.expectTrialSelected();
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
    let productPromise: Promise<{ trial_duration: number }>;
    newUser.beforeEach(async ({ page }) => {
      productConfig = new ProductConfig(page);
      productPromise = captureProduct(page);
      await page.goto(URLs.forcedTrialProduct);
      await waitForSessionCookie(page.context());
    });
    newUser("Trial checkbox visible but disabled", async () => {
      await expect(productConfig.trialCheckbox).toBeVisible();
      await expect(productConfig.trialCheckbox).toBeDisabled();
      await productConfig.expectTrialSelected();
    });
    newUser("Trial description shows badge, duration and term", async () => {
      const { trial_duration } = await productPromise;
      await expect(productConfig.trialBadge).toBeVisible();
      await expect(productConfig.trialBadge).toContainText("Free Trial");
      await expect(productConfig.trialDescription).toBeVisible();
      await expect(productConfig.trialDescription).toContainText(
        `${trial_duration} day`
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
  // ---------------------------------------------------------------------------
  newUser.describe("Product Card — Catalogue & Recommendations", () => {
    newUser("'Free Trial' badge on product card", async ({ page }) => {
      await page.goto(URLs.freeTrialsCategory);
      await waitForSessionCookie(page.context());
      await expect(
        page.getByTestId("badge").filter({ hasText: "Free Trial" }).first()
      ).toBeVisible();
    });
    newUser("CTA button shows 'Try free for X days'", async ({ page }) => {
      // Attach before navigation so we catch the catalogue products GET. Scoped
      // to this test (the only one that needs it) so the waiter can't leak into
      // sibling tests that never await it.
      const productsPromise = captureProducts(page);
      await page.goto(URLs.freeTrialsCategory);
      await waitForSessionCookie(page.context());
      const products = await productsPromise;
      const trialProduct = products.find(
        (p: { id?: string; trial_duration?: number }) =>
          typeof p.trial_duration === "number"
      );
      if (!trialProduct)
        throw new Error("No trial product in catalogue response");
      const cta = page
        .getByTestId(`product-card-${trialProduct!.id}`)
        .getByTestId("product-card-cta");
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute(
        "data-trial",
        String(trialProduct.trial_duration)
      );
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
    // Brand setting `ui.basket.add_to_basket_funnelling` controls whether
    // the card CTA quick-adds in-situ or navigates to the product page.
    // Each test pins the setting so the assertion is deterministic.
    newUser(
      "Quick-add fires trial-enabled basket POST when funnelling is in-situ",
      async ({ page, context }) => {
        const token = await getSessionToken(context);
        await interceptConfigValues(page, token, {
          basketFunnelling: "none"
        });

        await page.goto(URLs.freeTrialsCategory);
        const cta = page.getByTestId("product-card-cta").first();
        await clickAndAwaitBasketAdd(page, cta);
        await expect(page).toHaveURL(/\/order\/shop\b/);
      }
    );

    newUser(
      "Card click routes user onward when funnelling is next-step",
      async ({ page, context }) => {
        const token = await getSessionToken(context);
        await interceptConfigValues(page, token, {
          basketFunnelling: "next_step"
        });

        await page.goto(URLs.freeTrialsCategory);
        const cta = page.getByTestId("product-card-cta").first();
        const basketCount = page.getByTestId("basket-action-count");
        const catalogueUrl = page.url();
        const initialCount = (await basketCount.count())
          ? Number(await basketCount.innerText())
          : 0;

        await cta.click();

        // next-step funnels onward — exact destination depends on
        // recommendations / brand config; we just assert it moved.
        await expect(page).not.toHaveURL(catalogueUrl);
        const newCount = Number(await basketCount.innerText());
        expect(newCount).toBeGreaterThan(initialCount);
      }
    );
  });
  // TODO: add coverage for Free Trials display on the Recommendations page.
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
