import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Logins } from "../../support/constants/logins";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs } from "../../support/constants/urls";
import { getClientToken } from "../../support/api/auth";
import { Login } from "../../support/page-objects/templates/login";
import { Registration } from "../../support/page-objects/templates/registration";

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
    "GB"
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
        Logins.domain1.username,
        Logins.domain1.password
      );
      await enterDomainDetails();
      await productConfig.addToBasket.click();
      await basket.proceedToCheckout.click();
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickPlaceOrder();
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
    test("Log in at checkout", async ({ page }) => {
      await enterDomainDetails();
      await productConfig.addToBasket.click();
      await basket.proceedToCheckout.click();
      await page.getByText("Log in here").click();
      await login.inputLogin(Logins.domain2.username, Logins.domain2.password);
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickPlaceOrder();
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
  });
  test.describe("New Customer", () => {
    test("Register at checkout", async ({ page }) => {
      await enterDomainDetails();
      await productConfig.addToBasket.click();
      await basket.proceedToCheckout.click();
      await registration.inputRegistration();
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickPlaceOrder();
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
  });
});
