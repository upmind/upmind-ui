import { expect, test } from "@playwright/test";
import { newUser } from "../../../support/fixtures";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { BillingPage } from "../../../support/page-objects/templates/billing-page";
import { ProductConfig } from "../../../support/page-objects/templates/product-config";
import { ProductSetup } from "../../../support/page-objects/templates/product-setup";
import { Basket } from "../../../support/page-objects/templates/basket";
import { URLs } from "../../../support/constants/urls";
import {
  addAddressViaHeadless,
  fillRegistrantDetails,
  getBasketViaHeadless,
  goToCheckout,
  loginAsIncompleteCustomer,
  registerClientViaHeadless,
  seedGuestBasket,
  seedInvalidProduct,
  setOrderBillingViaHeadless
} from "../../../support/flows";
import { products } from "../../../support/constants/products";
import {
  interceptUISchema,
  interceptConfigValues
} from "../../../support/mocks/brand";
import { gateways } from "../../../support/constants/gateways";
import { Registration } from "../../../support/page-objects/templates/registration";
import { waitForSessionCookie } from "../../../support/helpers/session";
import { waitForBillingUpdate } from "../../../support/helpers/checkout";
import type { AddressModel } from "@upmind-automation/headless";

let checkout: Checkout;
let billingPage: BillingPage;
let registration: Registration;

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

test.describe("Standalone Billing Details Page @standalone-billing", () => {
  test.describe("Checkout - Billing Summary Mode (default)", () => {
    test.beforeEach(async ({ page, context }) => {
      checkout = new Checkout(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await registerClientViaHeadless(page);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
    });

    test("BillingSummary card is visible at checkout", async ({
      page,
      context
    }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      await expect(checkout.addNewAddress).toBeVisible();
    });

    test("Summary displays selected address", async ({ page, context }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await checkout.billingDetails.waitFor();
      billingPage = new BillingPage(page);
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await expect(billingPage.personalTab).toBeVisible();
      await billingPage.personalTab.click();
      await billingPage.manuallyInputAddress(
        "10 Downing Street",
        "London",
        "SW1A 2AB"
      );
      const billingUpdateRequest = waitForBillingUpdate(page);
      await billingPage.saveDetails.click();
      await billingUpdateRequest;
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      // The address title is carried in billing-summary-address's
      // data-test-value; the manually entered address uses "10 Downing Street"
      // as the address name / line 1.
      await expect(checkout.billingSummaryAddress).toBeVisible();
      await expect(checkout.billingSummaryAddress).toHaveAttribute(
        "data-test-value",
        "10 Downing Street"
      );
    });

    test("'Change' link navigates to billing page", async ({
      page,
      context
    }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await checkout.billingDetails.waitFor();
      const order = await getBasketViaHeadless(page);
      await addAddressViaHeadless(
        page,
        order?.client_id as string,
        SEEDED_ADDRESS
      );
      await expect(checkout.billingSummaryChangeLink).toBeVisible({
        timeout: 15000
      });
      await checkout.billingSummaryChangeLink.click();
      await expect(checkout.billingCards).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Checkout - Inline Mode (billingDetailsDisabled)", () => {
    test.beforeEach(async ({ page, context }) => {
      checkout = new Checkout(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await registerClientViaHeadless(page);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": true
      });
      await goToCheckout(page, products.STARTER_HOSTING);
    });

    test("Inline billing form shown when standalone is disabled", async () => {
      await expect(checkout.billingCards).toBeVisible({ timeout: 15000 });
      await expect(checkout.billingDetails).toBeHidden();
    });
  });

  test.describe("Standalone Billing Page", () => {
    test.beforeEach(async ({ page, context }) => {
      billingPage = new BillingPage(page);
      checkout = new Checkout(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await registerClientViaHeadless(page);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, products.STARTER_HOSTING);
    });

    test("Billing page loads at /order/basket/billing/", async ({ page }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
    });

    test("'Back to basket' link navigates back", async ({ page }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.backToBasket).toBeVisible({ timeout: 15000 });
      await billingPage.backToBasket.click();
      await expect(page.getByTestId("basket-product").first()).toBeVisible({
        timeout: 15000
      });
    });

    test("Can add new address on billing page", async ({ page }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await expect(billingPage.personalTab).toBeVisible();
      await billingPage.personalTab.click();
      await billingPage.manuallyInputAddress(
        "10 Downing Street",
        "London",
        "SW1A 2AB"
      );
      const billingUpdateRequest = waitForBillingUpdate(page);
      await billingPage.saveDetails.click();
      await billingUpdateRequest;
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      // The entered address line 1 is carried in billing-summary-address's
      // data-test-value (the address title), separated from the multi-line
      // rendered rows.
      await expect(checkout.billingSummaryAddress).toBeVisible();
      await expect(checkout.billingSummaryAddress).toHaveAttribute(
        "data-test-value",
        "10 Downing Street"
      );
    });

    test("Personal/Business tab switching", async ({ page, context }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await expect(billingPage.personalTab).toBeVisible();
      await expect(billingPage.businessTab).toBeVisible();
      await billingPage.businessTab.click();
      // Business form loads via a skeleton (form-loading) then resolves to the
      // loaded form (form-manage). Gate on the loaded marker before switching.
      await expect(page.getByTestId("form-manage")).toBeVisible({
        timeout: 15000
      });
      await billingPage.personalTab.click();
    });
  });

  test.describe("Navigation: Checkout → Billing → Checkout", () => {
    test.beforeEach(async ({ page, context }) => {
      checkout = new Checkout(page);
      billingPage = new BillingPage(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await registerClientViaHeadless(page);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, products.STARTER_HOSTING);
      const order = await getBasketViaHeadless(page);
      const client = order?.client_id as string;
      const addressId = await addAddressViaHeadless(
        page,
        client,
        SEEDED_ADDRESS
      );
      await setOrderBillingViaHeadless(page, { addressId });
      await page.reload();
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
    });

    test("Round-trip: update address on billing page", async ({
      page,
      context
    }) => {
      await expect(checkout.billingSummaryChangeLink).toBeVisible({
        timeout: 15000
      });
      await checkout.billingSummaryChangeLink.click();
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await expect(billingPage.personalTab).toBeVisible();
      await billingPage.personalTab.click();
      const changeLink = page.getByTestId("link-edit");
      await expect(changeLink).toBeVisible();
      await changeLink.click();
      await billingPage.addressLine1.fill("15 White Hart Lane");
      await billingPage.city.fill("Manchester");
      await billingPage.postCode.fill("M1 1AA");
      // The address form's input is debounced (DEBOUNCE_DELAY = 350ms). Blur to
      // fire the change, confirm the field holds the edit, then let the debounced
      // SET commit to the model before saving — otherwise the save PUTs the stale
      // pre-edit model and the summary shows the old address.
      await billingPage.postCode.blur();
      await expect(billingPage.addressLine1).toHaveValue("15 White Hart Lane");
      await page.waitForTimeout(350);
      // ASSERT the edit reached the wire (tests assert, don't assume the settle
      // worked): the address PUT payload must carry the new street, not the
      // stale pre-edit model. This localises a debounce/race regression to the
      // request instead of the far-downstream summary assertion.
      const editRequest = page.waitForRequest(
        r =>
          r.method() === "PUT" &&
          /\/clients\/[^/]+\/addresses\/[^/?]+/.test(r.url())
      );
      await checkout.clickSaveDetails();
      const req = await editRequest;
      expect(JSON.stringify(req.postDataJSON())).toContain(
        "15 White Hart Lane"
      );
      await expect(checkout.dialogWindow).toBeHidden();
      await billingPage.continue.click();
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      // The updated address line 1 is carried in billing-summary-address's
      // data-test-value (the address title).
      await expect(checkout.billingSummaryAddress).toBeVisible();
      await expect(checkout.billingSummaryAddress).toHaveAttribute(
        "data-test-value",
        "15 White Hart Lane"
      );
    });

    test("Round-trip: add company on billing page", async ({ page }) => {
      await expect(checkout.billingSummaryChangeLink).toBeVisible({
        timeout: 15000
      });
      await checkout.billingSummaryChangeLink.click();
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await expect(billingPage.businessTab).toBeVisible();
      await billingPage.businessTab.click();
      await expect(page.getByTestId("form-manage")).toBeVisible({
        timeout: 15000
      });
      const companyNameInput = page
        .getByTestId("form-item")
        .and(page.locator(`[data-test-value="company-name"]`))
        .locator("input");
      await companyNameInput.waitFor({ state: "visible" });
      await companyNameInput.fill("E2E Test Company Ltd");
      // The client already has a saved address (seeded in beforeEach), so the
      // company form defaults its addressId to that address and renders the
      // existing-address selector — not the Google address search. The company
      // is therefore valid with just the name; save it to the companies endpoint.
      // Mirror the sibling address round-trip (mutation-chain rule): the POST
      // /clients/{id}/companies payload must carry the entered name, so a
      // dropped/stale company fails at the wire, not only at the summary.
      const companyRequest = page.waitForRequest(
        r =>
          r.method() === "POST" && /\/clients\/[^/]+\/companies/.test(r.url())
      );
      await checkout.clickSaveDetails("companies");
      expect(JSON.stringify((await companyRequest).postDataJSON())).toContain(
        "E2E Test Company Ltd"
      );
      // Adding a company commits billing and auto-advances to checkout
      // (BillingForm.onFormResolve → navigateNext), so assert on the checkout
      // summary directly rather than routing back through the basket.
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      // The entered company name is carried in billing-summary-company's
      // data-test-value.
      await expect(checkout.billingSummaryCompany).toBeVisible();
      await expect(checkout.billingSummaryCompany).toHaveAttribute(
        "data-test-value",
        "E2E Test Company Ltd"
      );
    });
  });

  test.describe("Missing Billing Data", () => {
    test("'Add address' link when address required but missing", async ({
      page,
      context
    }) => {
      checkout = new Checkout(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await registerClientViaHeadless(page);
      await goToCheckout(page, products.STARTER_HOSTING);
      await expect(checkout.basketSummary).toBeVisible({ timeout: 15000 });
      interceptConfigValues(page, {
        requireAddressForOrders: true,
        requireCompanyForOrders: false,
        requireRegionInAddress: false,
        requirePhoneForOrders: false
      });
      await page.reload();
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      await expect(checkout.billingAddAddress).toBeVisible();
    });

    test("'Add company' link when company required but missing", async ({
      page,
      context
    }) => {
      checkout = new Checkout(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await registerClientViaHeadless(page);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, products.STARTER_HOSTING);
      await expect(checkout.basketSummary).toBeVisible({ timeout: 15000 });
      interceptConfigValues(page, {
        requireAddressForOrders: false,
        requireCompanyForOrders: true,
        requireRegionInAddress: false,
        requirePhoneForOrders: false
      });
      await page.reload();
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      await expect(checkout.billingAddCompany).toBeVisible();
    });

    test("'Add number' link when phone required but missing", async ({
      page,
      context
    }) => {
      checkout = new Checkout(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await registerClientViaHeadless(page);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, products.STARTER_HOSTING);
      await expect(checkout.basketSummary).toBeVisible({ timeout: 15000 });
      interceptConfigValues(page, {
        requireAddressForOrders: false,
        requireCompanyForOrders: false,
        requireRegionInAddress: false,
        requirePhoneForOrders: true
      });
      await page.reload();
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      await expect(checkout.billingAddNumber).toBeVisible();
    });
  });

  test.describe("FE-2457: Initial billing UX", () => {
    test.beforeEach(async ({ page, context }) => {
      billingPage = new BillingPage(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await registerClientViaHeadless(page);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, products.STARTER_HOSTING);
    });

    test("Continue button is hidden for first-time clients with no saved address or company", async ({
      page
    }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      expect(await billingPage.continueIsHidden()).toBe(true);
    });

    test("Continue button is rendered once the client has at least one saved address", async ({
      page,
      context
    }) => {
      const order = await getBasketViaHeadless(page);
      const addressId = await addAddressViaHeadless(
        page,
        order?.client_id as string,
        SEEDED_ADDRESS
      );
      await setOrderBillingViaHeadless(page, { addressId });

      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await expect(billingPage.continue).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("FE-2457: Navigation Billing → Product Setup → Checkout", () => {
    test("billing → product-setup → checkout chain works end-to-end", async ({
      page,
      context
    }) => {
      const basket = new Basket(page);
      const productConfig = new ProductConfig(page);
      const productSetup = new ProductSetup(page);
      checkout = new Checkout(page);

      await loginAsIncompleteCustomer(page);
      await seedInvalidProduct(page, products.DOMAIN_2);

      await page.goto(URLs.basket);
      await basket.proceedToCheckout.click();
      await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
      await fillRegistrantDetails(productConfig);
      await productSetup.submit();
      await expect(checkout.basketSummary).toBeVisible({ timeout: 15000 });
      await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
      await checkout.clickCompleteCheckout();
      await expect(page.getByTestId("order-confirmation-heading")).toBeVisible({
        timeout: 30000
      });
    });
  });

  test.describe("Access Control", () => {
    test("Billing page requires authentication", async ({ page }) => {
      // guardBilling checks products BEFORE auth: an empty basket is bounced to
      // the basket route (Empty.vue), so ONLY a basket with products reaches the
      // "unauthenticated → register" branch. Seed a guest product first so this
      // exercises the AUTH guard, not the empty-basket guard.
      await seedGuestBasket(page);
      await page.goto(URLs.billing);
      await waitForSessionCookie(page.context());
      // Behaviour, not URL shape: a signed-out visitor is funnel-guarded off
      // the billing page and handed to the full-page register form. That form
      // is Auth.vue's Form, which carries data-test-key="session-form" +
      // data-test-value="register" (there is no `register-form` testid in app
      // source) — see the sibling auth-route / guest-checkout specs.
      await expect(
        page
          .getByTestId("session-form")
          .and(page.locator(`[data-test-value="register"]`))
      ).toBeVisible();
    });

    newUser(
      "Billing page requires basket with products",
      async ({ page, context }) => {
        await page.goto("/");
        await waitForSessionCookie(context);
        interceptUISchema(context, {
          "@data.billing_details.billingDetailsDisabled": false
        });
        await page.goto(URLs.billing);
        await waitForSessionCookie(page.context());
        await expect(page.getByTestId("basket-empty-message")).toBeVisible();
      }
    );
  });
});
