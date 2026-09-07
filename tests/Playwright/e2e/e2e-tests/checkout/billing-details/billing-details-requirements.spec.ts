import { test, expect, type Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import {
  addBillingAddressViaHeadless,
  addProductViaHeadless,
  registerClientViaHeadless
} from "../../../support/flows";
import { interceptConfigValues } from "../../../support/mocks/brand";
import { gateways } from "../../../support/constants/gateways";
import { URLs } from "../../../support/constants/urls";
import type { AddressModel } from "@upmind-automation/headless";

// NB: no `name` — a `name` on the model triggers the Google address-search
// path, which asynchronously re-derives the address and clobbers these fields.
const SEEDED_ADDRESS: AddressModel = {
  address: {
    address1: "10 Downing Street",
    address2: "",
    city: "London",
    countryId: "320e4357-95e7-8d18-484f-31643202d986",
    postcode: "SW1A 2AB",
    regionId: "de78642d-e539-7146-295f-21208469530d"
  }
};

/**
 * Boots the app as a brand-new client with one hosting product in the basket.
 * Fresh clients replace the shared Logins.brandUser: that account carries ten
 * addresses and a company, so every "required but missing" premise was already
 * met for it and the order placed. Returns the client id for seeding.
 */
async function bootFreshClient(page: Page): Promise<string> {
  await page.goto(URLs.basket);
  const { id } = await registerClientViaHeadless(page);
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
  return id;
}

test.describe("Verify checkout billing detail requirements", () => {
  // FE-2985 out of scope (no mutation to guard): every test here is a
  // requirement/validation NEGATIVE path — it proves checkout BLOCKS (the
  // billing-needs-input alert, the region-required message) when a required
  // field is missing, so no successful billing PUT ever fires to assert a
  // payload against. The change→save mutation-payload guards for billing edits
  // live in standalone-billing.spec.ts and update-billing-details.spec.ts.
  //
  // Brand config is static + persisted from the first boot
  // (brand.services.ts:119-121), so each test arms its requirement mock BEFORE
  // bootFreshClient — a beforeEach would boot first and the mock would never
  // apply. A client with no saved details gets the inline billing form
  // (CheckoutBilling.vue); one with a committed address gets the summary, whose
  // missing rows carry the "Add …" links.
  let checkout: Checkout;

  test.beforeEach(({ page }) => {
    checkout = new Checkout(page);
  });

  test("Address required at checkout", async ({ page }) => {
    await interceptConfigValues(page, {
      requireAddressForOrders: true,
      requireCompanyForOrders: false,
      requireRegionInAddress: false,
      requirePhoneForOrders: false
    });
    await bootFreshClient(page);
    await page.goto(URLs.checkout);
    // No saved details → the entry form; the refusal surfaces as its validation.
    await expect(checkout.billingCards).toBeVisible();
    await checkout.selectGatewayByType(gateways.OFFLINE);
    await checkout.attemptPlaceOrder();
    await expect(
      checkout.sectionValidationMessage(checkout.billingSection)
    ).toBeVisible();
    await expect(checkout.billingSection).toBeInViewport();
    await expect(checkout.completeCheckout).toBeVisible();
  });

  test("Company required at checkout", async ({ page }) => {
    await interceptConfigValues(page, {
      requireAddressForOrders: false,
      requireCompanyForOrders: true,
      requireRegionInAddress: false,
      requirePhoneForOrders: false
    });
    await bootFreshClient(page);
    await page.goto(URLs.checkout);
    // A company requirement makes billing uncommittable without one, so a
    // client with no company is shown the entry form on its business tab —
    // the personal tab is withheld (BillingForm.vue tabs) — and Place Order
    // is refused with the form's validation.
    await expect(checkout.billingCards).toBeVisible();
    await expect(page.getByTestId("tab-business-details")).toBeVisible();
    await expect(page.getByTestId("tab-personal-details")).toHaveCount(0);
    await checkout.selectGatewayByType(gateways.OFFLINE);
    await checkout.attemptPlaceOrder();
    await expect(
      checkout.sectionValidationMessage(checkout.billingSection)
    ).toBeVisible();
    await expect(checkout.completeCheckout).toBeVisible();
  });

  test("Region required on address", async ({ page }) => {
    await interceptConfigValues(page, {
      requireAddressForOrders: true,
      requireCompanyForOrders: false,
      requireRegionInAddress: true,
      requirePhoneForOrders: false
    });
    await bootFreshClient(page);
    await page.goto(URLs.checkout);
    await expect(checkout.billingCards).toBeVisible();
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
    await interceptConfigValues(page, {
      requireAddressForOrders: false,
      requireCompanyForOrders: false,
      requireRegionInAddress: false,
      requirePhoneForOrders: true
    });
    const id = await bootFreshClient(page);
    await addBillingAddressViaHeadless(page, id, SEEDED_ADDRESS);
    await page.goto(URLs.checkout);
    await expect(checkout.billingDetails).toBeVisible();
    await expect(checkout.billingNeedsInputAlert).toBeVisible();
    await expect(checkout.addNewPhone).toBeVisible();
  });
});
