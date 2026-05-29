import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Logins } from "../../support/constants/logins";
import { TEST_EMAILS } from "../../support/constants/test-data";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs } from "../../support/constants/urls";
import { getClientToken } from "../../support/api/auth";
import { clearBasket, getCurrentOrder } from "../../support/api/basket";
import { Login } from "../../support/page-objects/templates/login";
import { Registration } from "../../support/page-objects/templates/registration";
import { BillingPage } from "../../support/page-objects/templates/billing-page";
import { captureProduct } from "../../support/mocks/products";
import { interceptConfigValues } from "../../support/mocks/brand";
import { waitForBillingUpdate } from "../../support/helpers/checkout";
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
      const session = await getClientToken(
        page,
        Logins.domain1.username,
        Logins.domain1.password
      );
      // Shared staging account: clear any stale/invalid items left in the
      // persisted basket by prior runs before adding the test domain.
      const token = session.access_token;
      const order = await getCurrentOrder(token);
      if (order?.id) await clearBasket(token, order.id);
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
    // @quarantine(FE-2785, 2026-06-28)
    test.skip("Register at checkout — billing address required", async ({
      page
    }) => {
      // Pin the brand to require a billing address from the start (null token →
      // no auth override, busts cache; see FE-2785), so the mock is active for
      // the whole flow and the post-registration routing sends a new addressless
      // customer through billing — no session-dropping reload needed.
      await interceptConfigValues(page, null, {
        requireAddressForOrders: true,
        requireCompanyForOrders: false,
        requireRegionInAddress: false,
        requirePhoneForOrders: false
      });
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
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickCompleteCheckout();
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });

    // @quarantine(FE-2785, 2026-06-28)
    test.skip("Register at checkout — no billing address required", async ({
      page
    }) => {
      // Pin the brand to NOT require a billing address from the start, so the
      // post-registration routing skips billing straight to payment — no reload.
      await interceptConfigValues(page, null, {
        requireAddressForOrders: false,
        requireCompanyForOrders: false,
        requireRegionInAddress: false,
        requirePhoneForOrders: false
      });
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
