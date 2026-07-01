import { test, expect, BrowserContext } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { ProductConfig } from "../support/page-objects/templates/product-config";
import { Basket } from "../support/page-objects/templates/basket";
import { addProductToOrder, createOrder } from "../support/api/basket";
import { Registration } from "../support/page-objects/templates/registration";
import { Checkout } from "../support/page-objects/templates/checkout";
import { Confirmation } from "../support/page-objects/templates/confirmation";
import { goToCheckout } from "../support/flows/checkout";
import { mockPromos } from "../support/mocks/promotions";
import { returnError } from "../support/mocks/errors";
import { fakerEN_GB } from "@faker-js/faker";
import { products } from "../support/constants/products";
import { gateways } from "../support/constants/gateways";
import {
  getClientToken,
  getSessionToken,
  registerClient
} from "../support/api/index";
import { waitForSessionCookie } from "../support/helpers/session";

// TODO: migrate to the fixture-based pattern used by newer specs
// (see support/fixtures/auth-context). Module-scope `let` declarations
// reassigned in beforeEach are fragile if this file ever runs in
// parallel mode and should be replaced with per-test fixtures.
let context: BrowserContext;
let productConfig: ProductConfig;
let basket: Basket;
let checkout: Checkout;
let confirmation: Confirmation;

const promoCode = "genericpromo";
const promoError = (message: string) => ({
  id: "c3bf0fb8c606e9f2fe5eb74a16415ae9ed69eac4",
  type: 0,
  code: 409,
  message
});
const promoErrorScenarios = [
  {
    name: "invalid promo code",
    message: `${promoCode} is not a valid promotion code`
  },
  {
    name: "invalid product in basket",
    message: "No products in basket qualify for this promotion"
  },
  {
    name: "expired promo code",
    message: `Outdated promotion with code: ${promoCode}`
  },
  {
    name: "combining invalid promo codes",
    message: `Unable to combine promotion ${promoCode} with other promotions`
  }
];

test.describe("Promotions", () => {
  test.beforeEach(async ({ page, browser }) => {
    context = await browser.newContext();
    productConfig = new ProductConfig(page);
    basket = new Basket(page);
  });
  test.describe("Promotion Displayed On Product Config", () => {
    test("Promotion on all billing terms", async ({ page }) => {
      mockPromos(page.context(), "/api/basket/products/", {}, "all", "prices");
      await page.goto(URLs.starterHosting);
      await expect(productConfig.billingTerms).toBeVisible();
      await productConfig.promoBadgeExists(1);
      await productConfig.promoBadgeExists(12);
      await productConfig.promoBadgeExists(24);
    });
    test("Promotion on a single billing term", async ({ page }) => {
      mockPromos(page.context(), "/api/basket/products/", {}, 12, "prices");
      await page.goto(URLs.starterHosting);
      await expect(productConfig.billingTerms).toBeVisible();
      await productConfig.promoBadgeDoesNotExist(1);
      await productConfig.promoBadgeExists(12);
      await productConfig.promoBadgeDoesNotExist(24);
    });
  });
  test.describe("Promotion displayed on DAC", () => {
    // Skip: The starterHosting product doesn't have domain selection in its
    // configuration. The DAC Drawer test requires a product with domain
    // provisioning fields, which this product lacks. The DAC Widget and DAC
    // Page tests below cover promo badge display on DAC cards via direct URLs.
    test.skip("Promotions DAC Drawer", async ({ page }) => {
      mockPromos(
        page.context(),
        "/api/modules/web_hosting/domains/",
        {},
        "all",
        "prices"
      );
      await page.goto(URLs.starterHosting);
      // Click "Register a new domain" radio and fill the inline domain input
      await productConfig.domainRadioRegister.click();
      await productConfig.domainRadioInput.fill("promospromospromos");
      const dacCards = page.getByTestId("dac-card");
      await expect(dacCards.first()).toBeVisible();
      for (const card of await dacCards.all()) {
        await expect(card.getByTestId("badge")).toBeVisible();
      }
    });
    test("Promotions DAC Widget", async ({ page }) => {
      mockPromos(
        page.context(),
        "/api/modules/web_hosting/domains/",
        {},
        "all",
        "prices"
      );
      await page.goto(`${URLs.domainWidget}&search=promospromospromos`);
      const dacCards = page.getByTestId("dac-card");
      await expect(dacCards.first()).toBeVisible();
      for (const card of await dacCards.all()) {
        await expect(card.getByTestId("badge")).toBeVisible();
      }
    });
    test("Promotions DAC Page", async ({ page }) => {
      mockPromos(
        page.context(),
        "/api/modules/web_hosting/domains/",
        {},
        "all",
        "prices"
      );
      await page.goto(`${URLs.domainSearch}?search=promospromospromos`);
      await expect(page.getByTestId("dac-results")).toBeVisible();
      const dacCards = page.getByTestId("dac-card");
      await expect(dacCards.first()).toBeVisible();
      for (const card of await dacCards.all()) {
        await expect(card.getByTestId("badge")).toBeVisible();
      }
    });
  });
  test.describe("Promotion displayed on Catalogue", () => {
    test("Promotions on Catalogue Root", async ({ page }) => {
      mockPromos(page.context(), "/api/basket/products?", {}, "all", "prices");
      await page.goto(URLs.catalogueRoot1);
      await expect(page.getByTestId("badge").first()).toBeVisible();
    });
    test("Promotions on Catalogue Category", async ({ page }) => {
      mockPromos(page.context(), "/api/basket/products?", {}, "all", "prices");
      await page.goto(URLs.categoryPage);
      await expect(page.getByTestId("badge").first()).toBeVisible();
    });
    test("Promotions on Catalogue Nested Category", async ({ page }) => {
      mockPromos(page.context(), "/api/basket/products?", {}, "all", "prices");
      await page.goto(URLs.nestedCategoryPage);
      await expect(page.getByTestId("badge").first()).toBeVisible();
    });
  });
  test.describe("Promotion displayed on Basket", () => {
    test.beforeEach(async ({ page, context }) => {
      const domain = `${fakerEN_GB.string.alphanumeric({ length: 15 })}.com`;
      await page.goto("/");
      await waitForSessionCookie(context);
      let token = await getSessionToken(context);
      let order = await createOrder(token);
      let orderId = order.id;
      await addProductToOrder(
        token,
        orderId,
        products.STARTER_HOSTING.id,
        1,
        24,
        [],
        [],
        { domain: domain },
        [],
        true,
        false
      );
    });
    test("Promo request sent when adding promo to basket", async ({ page }) => {
      await page.goto(URLs.basket);
      await basket.addPromo.click();
      await basket.promoInput.fill(promoCode);
      const requestPromise = page.waitForRequest(
        req =>
          req.url().includes("/api/orders/") &&
          req.url().includes("/promotions") &&
          req.method() === "POST"
      );
      await basket.applyPromo.click();
      const request = await requestPromise;
      const body = request.postDataJSON();
      expect(body.promocode).toBe(promoCode);
    });
    test("Promo badge & details displayed on basket", async ({ page }) => {
      await page.goto(URLs.basket);
      await basket.addPromo.click();
      await basket.promoInput.fill(promoCode);
      await basket.applyPromo.click();
      await expect(
        page.getByTestId("basket-product-summary").getByTestId("badge")
      ).toBeVisible();
      await expect(
        page.getByTestId("section-basket-summary").getByTestId("badge")
      ).toContainText(promoCode);
    });
    for (const scenario of promoErrorScenarios) {
      test(`Error displayed for ${scenario.name}`, async ({ page }) => {
        await page.goto(URLs.basket);
        returnError(
          page,
          `**/api/orders/*/promotions**`,
          409,
          promoError(scenario.message)
        );
        await basket.addPromo.click();
        await basket.promoInput.fill(promoCode);
        await basket.applyPromo.click();
        await expect(basket.promoMessage).toContainText(scenario.message);
      });
    }
  });
  test.describe("Promotion displayed on Checkout", () => {
    test.beforeEach(async ({ page, context }) => {
      checkout = new Checkout(page);
      await page.goto("/");
      await waitForSessionCookie(context);
      let guestToken = await getSessionToken(context);
      let user = await registerClient(guestToken);
      let username = user.email;
      let password = user.password;
      await getClientToken(page, username, password);
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    });
    test("Promo badge/details displayed at checkout", async ({ page }) => {
      await checkout.addVoucherButton.click();
      await checkout.addVoucherInput.fill(promoCode);
      await checkout.applyVoucherButton.click();
      await expect(checkout.basketSummary.getByTestId("badge")).toContainText(
        promoCode
      );
    });
    for (const scenario of promoErrorScenarios) {
      test(`Error displayed for ${scenario.name}`, async ({ page }) => {
        returnError(
          page,
          `**/api/orders/*/promotions**`,
          409,
          promoError(scenario.message)
        );
        await checkout.addVoucherButton.click();
        await checkout.addVoucherInput.fill(promoCode);
        await checkout.applyVoucherButton.click();
        await expect(checkout.addVoucherMessage).toContainText(
          scenario.message
        );
      });
    }
  });
  test.describe("Promotion displayed on Confirmation", () => {
    test("Promo badge/details displayed at confirmation", async ({
      page,
      context
    }) => {
      checkout = new Checkout(page);
      confirmation = new Confirmation(page);
      await page.goto(URLs.catalogueRoot1);
      await waitForSessionCookie(context, { guestOnly: true });
      let guestToken = await getSessionToken(context);
      let user = await registerClient(guestToken);
      let username = user.email;
      let password = user.password;
      await getClientToken(page, username, password);
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        "genericpromo"
      );
      await expect(page.getByTestId("checkout-heading")).toBeVisible();
      await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
      // The discount line renders only when the promo discount applied; its
      // amount has no data-test-value on the row, so assert the line is present.
      await expect(page.getByTestId("discount-line-item")).toBeVisible();
    });
  });
});
