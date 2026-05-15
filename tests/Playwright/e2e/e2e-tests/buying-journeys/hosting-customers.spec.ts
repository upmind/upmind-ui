import { test, expect, Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Logins } from "../../support/constants/logins";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs, productAddUrl } from "../../support/constants/urls";
import { getClientToken, getSessionToken } from "../../support/api/auth";
import { Login } from "../../support/page-objects/templates/login";
import { Registration } from "../../support/page-objects/templates/registration";
import { interceptConfigValues } from "../../support/mocks/brand";
import { products } from "../../support/constants/products";
import {
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
      await getClientToken(
        page,
        Logins.hosting1.username,
        Logins.hosting1.password
      );
      await addProductToBasket();
      await basket.proceedToCheckout.click();
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickCompleteCheckout();
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
    test("Logged in customer adds in-situ from catalogue", async ({ page }) => {
      const { id } = products.TSHIRT;
      await getClientToken(
        page,
        Logins.hosting1.username,
        Logins.hosting1.password
      );
      await page.goto(URLs.basket);
      overrideBasketProductsLimit(page);
      await waitForSessionCookie(page.context());
      const token = await getSessionToken(page.context());
      await interceptConfigValues(page, token, { basketFunnelling: "none" });
      await page.goto(URLs.catalogueRoot1);
      await expect(page.getByTestId("products-grid")).toBeVisible();
      await page
        .getByTestId(`product-card-${id}`)
        .getByTestId("button-add-to-basket")
        .click();
      await page.waitForTimeout(1000);
      await page.goto(URLs.basket);
      await basket.proceedToCheckout.click();
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickCompleteCheckout();
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
    test("Log in at checkout", async ({ page }) => {
      await addProductToBasket();
      await basket.proceedToCheckout.click();
      await page.getByText("Log in here").click();
      await login.inputLogin(
        Logins.hosting2.username,
        Logins.hosting2.password
      );
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickCompleteCheckout();
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
  });
  test.describe("New Customer", () => {
    test("Register at checkout", async ({ page }) => {
      await addProductToBasket();
      await basket.proceedToCheckout.click();
      await registration.inputRegistration();
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickCompleteCheckout();
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
  });
});
