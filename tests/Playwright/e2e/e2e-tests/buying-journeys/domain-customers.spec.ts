import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Logins } from "../../support/constants/logins";
import { TEST_EMAILS } from "../../support/constants/test-data";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { gateways } from "../../support/constants/gateways";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs } from "../../support/constants/urls";
import { Login } from "../../support/page-objects/templates/login";
import { Registration } from "../../support/page-objects/templates/registration";
import { BillingPage } from "../../support/page-objects/templates/billing-page";
import { captureProduct } from "../../support/mocks/products";
import { captureBrandSettings } from "../../support/mocks/brand";
import { waitForBillingUpdate } from "../../support/helpers/checkout";
import {
  clearBasketViaHeadless,
  loginViaHeadless,
  selectRequiredMultiDefaults
} from "../../support/flows";

// Brand-config key deciding whether checkout demands a billing address. Same
// literal key the brand mock uses (mocks/brand.ts) — mirrors
// `BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS` from @upmind-automation/types.
const REQUIRE_ADDRESS_FOR_ORDERS = "invoices.common.require_address_for_orders";

let productConfig: ProductConfig;
let checkout: Checkout;
let basket: Basket;
let login: Login;
let registration: Registration;
// Real brand settings, captured from the app's own config GET on first load.
// Used to gate the register-at-checkout flows on whether the brand demands a
// billing address — instead of mocking the config (which drifts via cache).
let brandSettings: Record<string, unknown> = {};

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
    // Capture the real brand settings from the app's own config GET on first
    // load (REQUIRE_ADDRESS_FOR_ORDERS is in the default key set, so it's here).
    const settings = captureBrandSettings(page);
    await page.goto(URLs.basket);
    brandSettings = await settings;
  });
  test.describe("Existing Customer", async () => {
    test("Logged in customer", async ({ page }) => {
      await loginViaHeadless(
        page,
        Logins.domain1.username,
        Logins.domain1.password
      );
      // Shared staging account: clear any stale/invalid items left in the
      // persisted basket by prior runs before adding the test domain.
      await clearBasketViaHeadless(page);
      await enterDomainDetails();
      await productConfig.addToBasket.click();
      await basket.proceedToCheckout.click();
      await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    test("Log in at checkout", async ({ page }) => {
      await enterDomainDetails();
      await productConfig.addToBasket.click();
      await basket.proceedToCheckout.click();
      // session/Register.vue now tags the register→login switch link with the
      // static `checkout-login-link` testid (locale-safe; replaces the
      // English-only label-derived id, P9).
      await page.getByTestId("checkout-login-link").click();
      await login.inputLogin(Logins.domain2.username, Logins.domain2.password);
      await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
  });
  test.describe("New Customer", () => {
    test("Register at checkout — billing address required", async ({
      page
    }) => {
      // Only valid when the brand actually demands a billing address — then a
      // new (addressless) customer is routed through billing after registering.
      // Read the real setting; don't mock it (mocking drifts via TanStack cache).
      test.skip(
        !brandSettings[REQUIRE_ADDRESS_FOR_ORDERS],
        "Brand does not require a billing address at checkout"
      );
      await enterDomainDetails();
      await productConfig.addToBasket.click();
      await basket.proceedToCheckout.click();
      await registration.inputRegistration();
      const billingPage = new BillingPage(page);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await billingPage.personalTab.click();
      await billingPage.manuallyInputAddress(
        "10 Downing Street",
        "London",
        "SW1A 2AB"
      );
      const billingUpdate = waitForBillingUpdate(page);
      await billingPage.saveDetails.click();
      await billingUpdate;
      await page.waitForURL("**/order/checkout**");
      await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });

    test("Register at checkout — no billing address required", async ({
      page
    }) => {
      // Only valid when the brand does NOT demand a billing address — then the
      // domain's registrant details satisfy the address need and the funnel
      // skips billing straight to payment after registering. Read the real
      // setting; don't mock it (mocking drifts via TanStack cache).
      test.skip(
        !!brandSettings[REQUIRE_ADDRESS_FOR_ORDERS],
        "Brand requires a billing address at checkout"
      );
      await enterDomainDetails();
      await productConfig.addToBasket.click();
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
