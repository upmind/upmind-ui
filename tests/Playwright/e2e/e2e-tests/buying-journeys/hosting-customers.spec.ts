import { test, expect, Page } from "@playwright/test";
import { Logins } from "../../support/constants/logins";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { gateways } from "../../support/constants/gateways";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs } from "../../support/constants/urls";
import { loginViaHeadless } from "../../support/flows";
import { Login } from "../../support/page-objects/templates/login";
import { Registration } from "../../support/page-objects/templates/registration";
import { interceptConfigValues } from "../../support/mocks/brand";
import { products } from "../../support/constants/products";
import {
  clickAndAwaitBasketAdd,
  waitForSessionCookie,
  overrideBasketProductsLimit
} from "../../support/helpers/index";
let page: Page;
let productConfig: ProductConfig;
let checkout: Checkout;
let basket: Basket;
let login: Login;
let registration: Registration;

async function addProductToBasket() {
  await productConfig.page.goto(URLs.starterHosting);
  await productConfig.addToBasket.click();
}

test.describe("Hosting customers", async () => {
  test.beforeEach(async ({ page, context }) => {
    productConfig = new ProductConfig(page);
    checkout = new Checkout(page);
    basket = new Basket(page);
    login = new Login(page);
    registration = new Registration(page, context);
    await page.goto(URLs.basket);
  });
  test.describe.configure({ mode: "serial" });
  test.describe("Existing Customer", () => {
    test("Logged in customer", async ({ page }) => {
      await loginViaHeadless(
        page,
        Logins.hosting1.username,
        Logins.hosting1.password
      );
      await addProductToBasket();
      await basket.proceedToCheckout.click();
      await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    test("Logged in customer adds in-situ from catalogue", async ({ page }) => {
      // HAT is non-configurable, so with funnelling=none it adds in-situ from
      // the catalogue card (a configurable product would navigate to configure).
      const { id } = products.HAT;
      await loginViaHeadless(
        page,
        Logins.hosting1.username,
        Logins.hosting1.password
      );
      await page.goto(URLs.basket);
      overrideBasketProductsLimit(page);
      await waitForSessionCookie(page.context());
      // interceptConfigValues replays the request's own auth and strips
      // cache-validation headers so the catalogue's config fetch isn't lost to a 304.
      await interceptConfigValues(page, { basketFunnelling: "none" });
      await page.goto(URLs.catalogueRoot1);
      // Search for the product so it's in the grid regardless of how the
      // catalogue is categorised or paginated — don't assume it's on page 1.
      // (The catalogue product is named "Hat"; the constant name is annotated.)
      await page
        .getByTestId("input")
        .and(page.locator(`[data-test-value="product-search"]`))
        .fill("Hat");
      const cta = page
        .getByTestId("product-card")
        .and(page.locator(`[data-test-value="${id}"]`))
        .getByTestId("product-card-cta");
      await expect(cta).toBeVisible();
      await clickAndAwaitBasketAdd(page, cta);
      await page.goto(URLs.basket);
      await basket.proceedToCheckout.click();
      await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    test("Log in at checkout", async ({ page }) => {
      await addProductToBasket();
      await basket.proceedToCheckout.click();
      // session/Register.vue now tags the register→login switch link with the
      // static `checkout-login-link` testid (locale-safe; replaces the
      // English-only label-derived id, P9).
      await page.getByTestId("checkout-login-link").click();
      await login.inputLogin(
        Logins.hosting2.username,
        Logins.hosting2.password
      );
      await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
  });
  test.describe("New Customer", () => {
    test("Register at checkout", async ({ page }) => {
      await addProductToBasket();
      await basket.proceedToCheckout.click();
      await registration.inputRegistration();
      await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
  });
});
