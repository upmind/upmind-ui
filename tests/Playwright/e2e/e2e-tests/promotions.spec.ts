import { test, expect, BrowserContext } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { ProductConfig } from "../support/page-objects/templates/ProductConfig";
import { Basket } from "../support/page-objects/templates/Basket";
import {
  addProductToOrder,
  createOrder
} from "../support/utils/functions/basket";
import { getSessionToken } from "../support/utils/functions/tokens";
import { Registration } from "../support/page-objects/templates/Registration";
import { Checkout } from "../support/page-objects/templates/Checkout";
import { Confirmation } from "../support/page-objects/templates/Confirmation";
import { goToCheckout, mockPromos } from "../support/utils/apiHelper";
import { returnError } from "../support/utils/functions/errors";
import { fakerEN_GB } from "@faker-js/faker";
import { products } from "../support/constants/products";

let context: BrowserContext;
let productConfig: ProductConfig;
let basket: Basket;

let checkout: Checkout;
let confirmation: Confirmation;
let register: Registration;

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
      await page.waitForLoadState("networkidle");
      await productConfig.promoBadgeExists("Monthly");
      await productConfig.promoBadgeExists("Annually");
      await productConfig.promoBadgeExists("Biennially");
    });
    test("Promotion on a single billing term", async ({ page }) => {
      mockPromos(page.context(), "/api/basket/products/", {}, 12, "prices");
      await page.goto(URLs.starterHosting);
      await page.waitForLoadState("networkidle");
      await productConfig.promoBadgeDoesNotExist("Monthly");
      await productConfig.promoBadgeExists("Annually");
      await productConfig.promoBadgeDoesNotExist("Biennially");
    });
  });
  test.describe("Promotion displayed on DAC", () => {
    test("Promotions DAC Drawer", async ({ page }) => {
      mockPromos(
        page.context(),
        "/api/modules/web_hosting/domains/search",
        {},
        "all",
        "prices"
      );
      await page.goto(URLs.starterHosting);
      await productConfig.domainRegister.click();
      await productConfig.domainRegister
        .getByTestId("accordion-content")
        .locator("input")
        .fill("promospromospromos");
      await expect(
        page
          .getByTestId("checkbox-item-promospromospromos-com")
          .getByTestId("badge")
      ).toBeVisible();
    });
    test("Promotions DAC Widget", async ({ page }) => {
      mockPromos(
        page.context(),
        "/api/modules/web_hosting/domains/search",
        {},
        "all",
        "prices"
      );
      await page.goto(`${URLs.domainWidget}&search=promospromospromos`);
      await expect(
        page
          .getByTestId("checkbox-item-promospromospromos-com")
          .getByTestId("badge")
      ).toBeVisible();
    });
    test("Promotions DAC Page", async ({ page }) => {
      mockPromos(
        page.context(),
        "/api/modules/web_hosting/domains/search",
        {},
        "all",
        "prices"
      );
      await page.goto(`${URLs.domainSearch}?search=promospromospromos`);
      await page.waitForLoadState("networkidle");
      await expect(
        page
          .getByTestId("checkbox-item-promospromospromos-com")
          .getByTestId("badge")
      ).toBeVisible();
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
      await page.goto(URLs.baseUrl);
      await page.waitForLoadState("networkidle");
      let token = await getSessionToken(context);
      let order = await createOrder(token);
      let orderId = order.id;
      await addProductToOrder(
        token,
        orderId,
        "3de78642-de53-9714-76df-21208469530d", //TODO: Update to products file ref
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
      register = new Registration(page, context);
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await register.inputRegistration();
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
    test.fixme("Promo badge/details displayed at confirmation", async ({
      page
    }) => {
      //TODO: Add tests
      test.beforeEach(async ({ page, context }) => {
        confirmation = new Confirmation(page);
      });
    });
  });
});
