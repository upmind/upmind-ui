import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import {
  addProductViaHeadless,
  loginViaHeadless,
  waitForActiveSessionViaHeadless
} from "../../../support/flows";
import { interceptConfigValues } from "../../../support/mocks/brand";
import { gateways } from "../../../support/constants/gateways";
import { URLs } from "../../../support/constants/urls";
import { Logins } from "../../../support/constants/logins";
let checkout: Checkout;
test.describe("Verify checkout billing detail requirements", () => {
  // FE-2985 out of scope (no mutation to guard): every test here is a
  // requirement/validation NEGATIVE path — it proves checkout BLOCKS (the
  // billing-needs-input alert, the region-required message) when a required
  // field is missing, so no successful billing PUT ever fires to assert a
  // payload against. The change→save mutation-payload guards for billing edits
  // live in standalone-billing.spec.ts and update-billing-details.spec.ts.
  //
  // All tests below log in as Logins.brandUser via beforeEach. Serial mode
  // prevents them from racing against each other on the same staging account.
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.basket);
    await loginViaHeadless(
      page,
      Logins.brandUser.username,
      Logins.brandUser.password
    );
    await addProductViaHeadless(page, {
      productId: "3de78642-de53-9714-76df-21208469530d",
      quantity: 1,
      billingCycleMonths: 24,
      provisionFields: {
        domain: `${fakerEN_GB.string.alphanumeric({
          length: { min: 3, max: 15 }
        })}.com`
      }
    });
    await waitForActiveSessionViaHeadless(page);
    await page.goto(URLs.basket);
  });
  test("Address required at checkout", async ({ page, context }) => {
    interceptConfigValues(page, {
      requireAddressForOrders: true,
      requireCompanyForOrders: false,
      requireRegionInAddress: false,
      requirePhoneForOrders: false
    });
    await page.goto(URLs.checkout);
    await checkout.selectGatewayByType(gateways.OFFLINE);
    await checkout.completeCheckout.click();
    await checkout.completeCheckout.click();
    await expect(checkout.billingNeedsInputAlert).toBeVisible();
    await expect(checkout.addNewAddress).toBeVisible();
  });
  test("Company required at checkout", async ({ page }) => {
    interceptConfigValues(page, {
      requireAddressForOrders: false,
      requireCompanyForOrders: true,
      requireRegionInAddress: false,
      requirePhoneForOrders: false
    });
    await page.goto(URLs.checkout);
    await checkout.selectGatewayByType(gateways.OFFLINE);
    await checkout.completeCheckout.click();
    await checkout.completeCheckout.click();
    await expect(checkout.billingNeedsInputAlert).toBeVisible();
    await expect(checkout.addNewCompany).toBeVisible();
  });
  test("Region required on address", async ({ page, context }) => {
    interceptConfigValues(page, {
      requireAddressForOrders: true,
      requireCompanyForOrders: false,
      requireRegionInAddress: true,
      requirePhoneForOrders: false
    });
    await page.goto(URLs.checkout);
    await checkout.addNewAddress.click();
    await checkout.manuallyInputAddress(
      `${fakerEN_GB.location.streetAddress()}`,
      `${fakerEN_GB.location.city()}`,
      "HU15 1EG",
      null
    );
    await checkout.saveDetails.click();
    await expect(checkout.addressRegionMessage).toBeVisible();
  });
  test("Phone required at checkout", async ({ page }) => {
    interceptConfigValues(page, {
      requireAddressForOrders: false,
      requireCompanyForOrders: false,
      requireRegionInAddress: false,
      requirePhoneForOrders: true
    });
    await page.goto(URLs.checkout);
    await expect(checkout.billingNeedsInputAlert).toBeVisible();
    await expect(checkout.addNewPhone).toBeVisible();
  });
});
