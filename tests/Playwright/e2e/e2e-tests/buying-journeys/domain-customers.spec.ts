import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Logins } from "../../support/constants/logins";
import { TEST_EMAILS } from "../../support/constants/test-data";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs } from "../../support/constants/urls";
import { getClientToken } from "../../support/api/auth";
import { Login } from "../../support/page-objects/templates/login";
import { Registration } from "../../support/page-objects/templates/registration";
import { captureProduct } from "../../support/mocks/products";
import { selectRequiredMultiDefaults } from "../../support/flows";

let productConfig: ProductConfig;
let checkout: Checkout;
let basket: Basket;
let login: Login;
let registration: Registration;

async function enterDomainDetails() {
  // Capture the raw product BEFORE navigation so we can introspect its schema
  // for any `required + multiple` option categories the machine cannot auto-default.
  const rawProductPromise = captureProduct(productConfig.page);
  await productConfig.page.goto(URLs.comDomain);
  const rawProduct = await rawProductPromise;

  await productConfig.enterSld(
    `${fakerEN_GB.string.alpha({ length: { min: 5, max: 10 } })}${fakerEN_GB.string.numeric({ length: { min: 2, max: 5 } })}`
  );
  await selectRequiredMultiDefaults(productConfig.page, rawProduct);
  await productConfig.enterRegistrantDetails({
    registrantName: `${fakerEN_GB.person.fullName()}`,
    registrantOrg: `${fakerEN_GB.person.zodiacSign()}`,
    registrantEmail: `nathan.robinson+${fakerEN_GB.string.alphanumeric({ length: { min: 5, max: 10 } })}@upmind.com`,
    registrantPhone: "07111111111",
    registrantAddr1: `${fakerEN_GB.location.streetAddress()}`,
    registrantCity: `${fakerEN_GB.location.city()}`,
    registrantState: `${fakerEN_GB.location.state()}`,
    registrantPostcode: `${fakerEN_GB.location.zipCode()}`,
    registrantCountryCode: "GB"
  });
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
      await checkout.clickCompleteCheckout();
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
    test("Log in at checkout", async ({ page }) => {
      await enterDomainDetails();
      await productConfig.addToBasket.click();
      await basket.proceedToCheckout.click();
      await page.getByText("Log in here").click();
      await login.inputLogin(Logins.domain2.username, Logins.domain2.password);
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickCompleteCheckout();
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
      await checkout.clickCompleteCheckout();
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
  });
});
