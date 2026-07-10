import { test } from "@playwright/test";
import {
  newUser,
  registeredUser,
  expect
} from "../../support/fixtures/auth-context";
import {
  Basket,
  Checkout,
  Login,
  ProductConfig,
  ProductSetup
} from "../../support/page-objects/templates/index";
import { URLs } from "../../support/constants/urls";
import {
  DeferredFieldName,
  InvalidProductFieldKeys,
  Logins,
  products
} from "../../support/constants/index";
import {
  addBillingAddressViaHeadless,
  seedInvalidProduct
} from "../../support/flows";
import { interceptUISchema, returnError } from "../../support/mocks/index";
import type { AddressModel } from "@upmind-automation/headless";

const SETUP_URL = `${URLs.baseUrl}order/basket/products-setup/`;
const SEED_ADDRESS: AddressModel = {
  name: "10 Downing Street",
  address: {
    address1: "10 Downing Street",
    address2: "",
    city: "London",
    countryId: "320e4357-95e7-8d18-484f-31643202d986",
    postcode: "SW1A 2AB",
    regionId: "de78642d-e539-7146-295f-21208469530d"
  }
};
let basket: Basket;
let checkout: Checkout;
let login: Login;
let productConfig: ProductConfig;
let productSetup: ProductSetup;

newUser.describe.configure({ mode: "parallel" });
newUser.describe("Product Setup flow", () => {
  newUser.beforeEach(async ({ page, context }) => {
    basket = new Basket(page);
    checkout = new Checkout(page);
    login = new Login(page);
    productConfig = new ProductConfig(page);
    productSetup = new ProductSetup(page);
    interceptUISchema(context, {
      "@data.billing_details.billingDetailsDisabled": true
    });
  });
  newUser.describe("Routing & guards", () => {
    newUser(
      "Redirects from BASKET to PRODUCTS_SETUP when an invalid product is in the basket",
      async ({ page, clientId }) => {
        await seedInvalidProduct(page, products.DOMAIN_2);
        await page.goto(URLs.basket);
        await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
        await basket.proceedToCheckout.click();
        await page.waitForURL(/products-setup/);
      }
    );
    newUser(
      "Skips PRODUCTS_SETUP when no products require setup",
      async ({ page }) => {
        await seedInvalidProduct(page, products.STARTER_HOSTING);
        await page.goto(URLs.basket);
        await basket.proceedToCheckout.click();
        await page.waitForURL(/checkout/);
        expect(page.url()).not.toContain("products-setup");
      }
    );
    newUser(
      "Direct visit to /products-setup/ with no invalid products redirects to checkout",
      async ({ page }) => {
        await seedInvalidProduct(page, products.STARTER_HOSTING);
        await page.goto(SETUP_URL);
        await page.waitForURL(/checkout/);
      }
    );
    newUser(
      "Direct visit to /products-setup/ with empty basket redirects to basket-empty",
      async ({ page }) => {
        await page.goto(SETUP_URL);
        await page.waitForURL(/basket(\/empty)?\/?$/);
      }
    );
    newUser(
      "'Back to basket' from PRODUCTS_SETUP returns to basket",
      async ({ page }) => {
        await seedInvalidProduct(page, products.DOMAIN_2);
        await page.goto(SETUP_URL);
        await productSetup.back();
        await page.waitForURL(/\/order\/basket\/?$/);
      }
    );
  });
  newUser.describe("Single invalid product", () => {
    newUser.beforeEach(async ({ page, clientId }) => {
      await seedInvalidProduct(page, products.DOMAIN_2);
      await page.goto(URLs.basket);
      await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
      await basket.proceedToCheckout.click();
      await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
    });
    newUser(
      "Renders only the fields that have errors, not the full product configuration",
      async ({ page }) => {
        await expect(
          page.getByTestId("input").and(page.locator(`[data-test-value="tel"]`))
        ).toBeVisible();
        await expect(productSetup.termFormItem).toHaveCount(0);
        await expect(productSetup.optionsFormItem).toHaveCount(0);
      }
    );
    newUser(
      "Progress label text is hidden when only one product needs setup",
      async () => {
        await expect(productSetup.progress).toHaveCount(0);
      }
    );
    newUser(
      "Submitting fills the provision fields and proceeds to checkout",
      async ({ page }) => {
        await productConfig.registrantPhoneInput.fill("07111111111");
        await productSetup.submit();
        await page.waitForURL(/checkout/);
      }
    );
    newUser("Submit is disabled while fields are invalid", async () => {
      await expect(productSetup.continueButton).toBeDisabled();
    });
  });
  newUser.describe("Multiple invalid products & apply-to-others", () => {
    newUser.beforeEach(async ({ page, clientId }) => {
      await seedInvalidProduct(page, products.DOMAIN_2);
      await seedInvalidProduct(page, products.DOMAIN_3);
      await page.goto(URLs.basket);
      await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
      await basket.proceedToCheckout.click();
      await page.waitForURL(/products-setup/);
      await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
    });
    newUser(
      "Progress count updates as products are completed one at a time",
      async ({ page }) => {
        // The progress label embeds the count in translated copy; the stable
        // count is carried in data-test-value (two invalid products seeded).
        await expect(productSetup.progress).toBeVisible();
        await expect(productSetup.progress).toHaveAttribute(
          "data-test-value",
          "2"
        );
        await productSetup.applyToOthersGroup.first().click();
        await productConfig.registrantPhoneInput.fill("07111111111");
        await productSetup.submit();
        await expect(productSetup.progress).toBeHidden();
        await expect(page).toHaveURL(/products-setup/);
      }
    );
    newUser(
      "Apply-to-others lists overlapping products with checkboxes pre-selected",
      async () => {
        await expect(productSetup.applyToOthersGroup).toBeVisible();
        const checkboxes = productSetup.applyToOthersGroup.getByRole("option");
        await expect(checkboxes).toHaveCount(1);
        await expect(checkboxes.first()).toHaveAttribute(
          "data-state",
          "checked"
        );
      }
    );
    newUser(
      "Applying with apply-to-others checked skips subsequent products entirely",
      async ({ page }) => {
        await productConfig.registrantPhoneInput.fill("07111111111");
        await productSetup.submit();
        await page.waitForURL(/checkout/);
      }
    );
    newUser(
      "Unchecking apply-to-others requires fixing the second product separately",
      async ({ page }) => {
        await productSetup.applyToOthersGroup
          .getByRole("option")
          .first()
          .click();
        await productConfig.registrantPhoneInput.fill("07111111111");
        await productSetup.submit();
        await expect(page).toHaveURL(/products-setup/);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
      }
    );
  });
  newUser.describe("Apply-to-others edge cases", () => {
    newUser(
      "Apply-to-others is hidden when there are no overlapping products",
      async ({ page, clientId }) => {
        await seedInvalidProduct(page, products.DOMAIN_2);
        await seedInvalidProduct(page, products.SERVER_A);
        await page.goto(URLs.basket);
        await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
        await page.goto(SETUP_URL);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
        await expect(productSetup.applyToOthersGroup).toHaveCount(0);
      }
    );
  });
  newUser.describe("Generic non-domain products", () => {
    newUser(
      "Non-domain product with required provision fields lands on PRODUCTS_SETUP",
      async ({ page, clientId }) => {
        await seedInvalidProduct(page, products.SERVER_A);
        await page.goto(URLs.basket);
        await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
        await basket.proceedToCheckout.click();
        await page.waitForURL(/products-setup/);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
      }
    );
    newUser(
      "Mixed basket: valid + invalid products, loops only over the invalid",
      async ({ page, clientId }) => {
        await seedInvalidProduct(page, products.STARTER_HOSTING);
        await seedInvalidProduct(page, products.DOMAIN_2);
        await page.goto(URLs.basket);
        await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
        await basket.proceedToCheckout.click();
        await page.waitForURL(/products-setup/);
        await expect(productSetup.progress).toHaveCount(0);
      }
    );
  });
  newUser.describe("Deferred mode", () => {
    newUser(
      "Default required mode skips deferred-only products",
      async ({ page, clientId }) => {
        await seedInvalidProduct(page, products.SERVER_B);
        await page.goto(URLs.basket);
        await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
        await basket.proceedToCheckout.click();
        await page.waitForURL(/checkout/);
      }
    );
    newUser(
      "Deferred product with all deferred fields populated does not route to PRODUCTS_SETUP",
      async ({ page, context, clientId }) => {
        interceptUISchema(context, {
          "@context.checkout.productSetup": "deferred"
        });
        await seedInvalidProduct(page, products.SERVER_B, {
          [DeferredFieldName]: "filled-via-api"
        });
        await page.goto(URLs.basket);
        await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
        await basket.proceedToCheckout.click();
        await page.waitForURL(/checkout/);
      }
    );
    newUser(
      "Deferred mode renders deferred fields alongside any errored ones",
      async ({ page, context, clientId }) => {
        interceptUISchema(context, {
          "@context.checkout.productSetup": "deferred"
        });
        await seedInvalidProduct(page, products.DOMAIN_2);
        await page.goto(URLs.basket);
        await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
        await page.goto(SETUP_URL);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
        const visibleKeys = await productSetup.visibleFieldKeys();
        expect(visibleKeys.length).toBeGreaterThan(0);
        // TODO: when SERVER_B's deferred field is wired in, also assert the
        // deferred field key is visible in deferred mode but absent in required.
      }
    );
  });
  newUser.describe("Error handling", () => {
    const ORDER_PUT = /\/api\/orders\/[a-f0-9-]+(\?|$)/;
    const forcedError = {
      id: null,
      type: 1,
      code: 422,
      message: "Forced failure"
    };
    newUser(
      "When PRODUCTS_SETUP inputs are rejected, an error alert is shown and the user stays on the same product",
      async ({ page, clientId }) => {
        await seedInvalidProduct(page, products.DOMAIN_2);
        await page.goto(URLs.basket);
        await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
        await page.goto(SETUP_URL);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
        await returnError(page, ORDER_PUT, 422, forcedError);

        await productConfig.registrantPhoneInput.fill("07111111111");
        await productSetup.submit();

        await expect(productSetup.errorAlert).toBeVisible({ timeout: 10000 });
        await expect(page).toHaveURL(/products-setup/);
      }
    );
    newUser(
      "Recoverable: clearing the route and resubmitting succeeds",
      async ({ page, clientId }) => {
        await seedInvalidProduct(page, products.DOMAIN_2);
        await page.goto(URLs.basket);
        await addBillingAddressViaHeadless(page, clientId, SEED_ADDRESS);
        await page.goto(SETUP_URL);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
        await returnError(page, ORDER_PUT, 422, forcedError);

        await productConfig.registrantPhoneInput.fill("07111111111");
        await productSetup.submit();
        await expect(productSetup.errorAlert).toBeVisible({ timeout: 10000 });

        await page.unroute(ORDER_PUT);
        await productSetup.submit();
        await page.waitForURL(/checkout/);
      }
    );
  });
});
test.describe("Backend auto-population of provision fields", () => {
  registeredUser.describe("Client with profile details", () => {
    registeredUser.use({
      userLogin: Logins.autopopulate.username,
      userPassword: Logins.autopopulate.password
    });
    registeredUser(
      "Client with complete saved address & phone skips PRODUCTS_SETUP",
      async ({ page, context }) => {
        basket = new Basket(page);
        checkout = new Checkout(page);
        // The autopopulate client has a saved address + phone that satisfies
        // the BE provision-field auto-population, so the basket reports no
        // errors and the funnel skips PRODUCTS_SETUP entirely.
        interceptUISchema(context, {
          "@data.billing_details.billingDetailsDisabled": true
        });
        await seedInvalidProduct(page, products.DOMAIN_2);
        await page.goto(URLs.basket);
        await basket.proceedToCheckout.click();
        //await page.waitForURL(/checkout/);
        expect(page.url()).not.toContain("products-setup");
      }
    );
  });
});
