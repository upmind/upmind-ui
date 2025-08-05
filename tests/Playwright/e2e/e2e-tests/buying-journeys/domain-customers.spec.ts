import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Logins } from "../../support/constants/logins";
import { ProductConfig } from "../../support/page-objects/templates/ProductConfig";
import { Checkout } from "../../support/page-objects/templates/Checkout";
import { Basket } from "../../support/page-objects/templates/Basket";
import { URLs } from "../../support/constants/urls";
import { getClientToken } from "../../support/utils/functions/tokens";
import { Login } from "../../support/page-objects/templates/Login";
import { Registration } from "../../support/page-objects/templates/Registration";

let productConfig: ProductConfig;
let checkout: Checkout;
let basket: Basket;
let login: Login;
let registration: Registration;

async function enterDomainDetails() {
  await productConfig.page.goto(URLs.comDomain);
  await productConfig.enterSld(
    `${fakerEN_GB.string.alpha({ length: { min: 5, max: 10 } })}${fakerEN_GB.string.numeric({ length: { min: 2, max: 5 } })}`
  );
  await productConfig.enterRegistrantDetails(
    `${fakerEN_GB.person.fullName()}`,
    `${fakerEN_GB.person.zodiacSign()}`,
    `nathan.robinson+${fakerEN_GB.string.alphanumeric({ length: { min: 5, max: 10 } })}@upmind.com`,
    "07111111111",
    `${fakerEN_GB.location.streetAddress()}`,
    `${fakerEN_GB.location.city()}`,
    `${fakerEN_GB.location.state()}`,
    `${fakerEN_GB.location.zipCode()}`,
    "BS"
  );
}

test.describe("Domain customers", () => {
  test.beforeEach(async ({ page, context }) => {
    productConfig = new ProductConfig(page);
    checkout = new Checkout(page);
    basket = new Basket(page);
    login = new Login(page);
    registration = new Registration(page, context);
    await page.goto(URLs.basket);
  });
  test.describe("Existing Customer", async () => {
    test("Logged in customer", async ({ page }) => {
      await getClientToken(
        page,
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await enterDomainDetails();
      await page.keyboard.press("Escape");
      await productConfig.confirmAndProceed.click();
      await basket.proceedToCheckout.click();
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await page.getByTestId("button-place-order").click();
      await expect(page.getByRole("dialog")).toContainText(
        "Converting your order"
      );
      await expect(page.getByRole("dialog")).toContainText("Order complete!");
    });
    test("Log in at checkout", async ({ page }) => {
      await enterDomainDetails();
      await page.keyboard.press("Escape");
      await productConfig.confirmAndProceed.click();
      await basket.proceedToCheckout.click();
      await page.getByText("Log in here").click();
      await login.inputLogin(
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await page.getByTestId("button-place-order").click();
      await expect(page.getByRole("dialog")).toContainText(
        "Converting your order"
      );
      await expect(page.getByRole("dialog")).toContainText("Order complete!");
    });
  });
  test.describe("New Customer", () => {
    test("Register at checkout", async ({ page }) => {
      await enterDomainDetails();
      await page.keyboard.press("Escape");
      await productConfig.confirmAndProceed.click();
      await basket.proceedToCheckout.click();
      await registration.inputRegistration();
      await checkout.manuallyInputAddress(
        `${fakerEN_GB.location.streetAddress()}`,
        `${fakerEN_GB.location.streetAddress()}`,
        `${fakerEN_GB.location.city()}`,
        "HU15 1EG",
        "07111111111"
      );
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await page.getByTestId("button-place-order").click();
      await expect(page.getByRole("dialog")).toContainText(
        "Converting your order"
      );
      await expect(page.getByRole("dialog")).toContainText("Order complete!");
    });
  });
});
