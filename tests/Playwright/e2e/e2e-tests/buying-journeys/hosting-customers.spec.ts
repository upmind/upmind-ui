import { test, expect, Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Logins } from "../../support/constants/logins";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs } from "../../support/constants/urls";
import { getClientToken } from "../../support/api/auth";
import { Login } from "../../support/page-objects/templates/login";
import { Registration } from "../../support/page-objects/templates/registration";
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
      await checkout.clickPlaceOrder();
      await expect(page.getByText("Thank you for your order.")).toBeVisible();
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
      await checkout.clickPlaceOrder();
      await expect(page.getByText("Thank you for your order.")).toBeVisible();
    });
  });
  test.describe("New Customer", () => {
    test("Register at checkout", async ({ page }) => {
      await addProductToBasket();
      await basket.proceedToCheckout.click();
      await registration.inputRegistration();
      await checkout.manuallyInputAddress(
        `${fakerEN_GB.location.streetAddress()}`,
        `${fakerEN_GB.location.city()}`,
        "HU15 1EG",
        null
      );
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickPlaceOrder();
      await expect(page.getByText("Thank you for your order.")).toBeVisible();
    });
  });
});
