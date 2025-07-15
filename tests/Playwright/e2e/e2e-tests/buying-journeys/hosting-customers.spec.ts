import { test, expect, Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Logins } from "../../support/constants/logins";
import { ProductConfig } from "../../support/page-objects/templates/ProductConfig";
import { Checkout } from "../../support/page-objects/templates/Checkout";
import { Basket } from "../../support/page-objects/templates/Basket";
import { URLs } from "../../support/constants/urls";
import { getClientToken } from "../../support/utils/functions/tokens";
import { Login } from "../../support/page-objects/templates/Login";
import { Registration } from "../../support/page-objects/templates/Registration";
let page: Page;
let productConfig: ProductConfig;
let checkout: Checkout;
let basket: Basket;
let login: Login;
let registration: Registration;

async function addProductToBasket() {
  await productConfig.page.goto(URLs.starterHosting);
  await productConfig.confirmAndProceed.click();
}

test.describe("Hosting customers", () => {
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
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await addProductToBasket();
      await basket.proceedToCheckout.click();
      await checkout.payWithExistingMethod();
      await expect(page.getByRole("dialog")).toContainText(
        "Converting your order"
      );
      await expect(page.getByRole("dialog")).toContainText(
        "Processing your payment"
      );
      await expect(page.getByRole("dialog")).toContainText("Order complete!");
    });
    test("Log in at checkout", async ({ page }) => {
      await addProductToBasket();
      await basket.proceedToCheckout.click();
      await page.getByText("Log in here").click();
      await login.inputLogin(
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await checkout.payWithExistingMethod();
      await expect(page.getByRole("dialog")).toContainText(
        "Converting your order"
      );
      await expect(page.getByRole("dialog")).toContainText(
        "Processing your payment"
      );
      await expect(page.getByRole("dialog")).toContainText("Order complete!");
    });
  });
  test.describe("New Customer", () => {
    test("Register at checkout", async ({ page }) => {
      await addProductToBasket();
      await basket.proceedToCheckout.click();
      await registration.inputRegistration();
      await checkout.manuallyInputAddress(
        `${fakerEN_GB.location.streetAddress()}`,
        `${fakerEN_GB.location.streetAddress()}`,
        `${fakerEN_GB.location.city()}`,
        "HU15 1EG",
        "07111111111"
      );
      await checkout.payWithBankTransfer();
      await expect(page.getByRole("dialog")).toContainText(
        "Converting your order"
      );
      await expect(page.getByRole("dialog")).toContainText("Order complete!");
    });
  });
});
