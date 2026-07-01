import { expect, test } from "@playwright/test";
import { newUser } from "../../../support/fixtures";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { BillingPage } from "../../../support/page-objects/templates/billing-page";
import { ProductConfig } from "../../../support/page-objects/templates/product-config";
import { ProductSetup } from "../../../support/page-objects/templates/product-setup";
import { Basket } from "../../../support/page-objects/templates/basket";
import { URLs } from "../../../support/constants/urls";
import {
  fillRegistrantDetails,
  goToCheckout,
  loginAsIncompleteCustomer,
  seedInvalidProduct
} from "../../../support/flows";
import { addAddressToClient } from "../../../support/api/client";
import { products } from "../../../support/constants/products";
import {
  interceptUISchema,
  interceptConfigValues
} from "../../../support/mocks/brand";
import { gateways } from "../../../support/constants/gateways";
import { getSessionToken, getClientToken } from "../../../support/api/auth";
import { Registration } from "../../../support/page-objects/templates/registration";
import { getCurrentOrder, setOrderAddress } from "../../../support/api/basket";
import { registerClient } from "../../../support/api/client";
import { waitForSessionCookie } from "../../../support/helpers/session";
import { waitForBillingUpdate } from "../../../support/helpers/checkout";

let checkout: Checkout;
let billingPage: BillingPage;
let registration: Registration;

test.describe("Standalone Billing Details Page @standalone-billing", () => {
  test.describe("Checkout - Billing Summary Mode (default)", () => {
    test.beforeEach(async ({ page, context }) => {
      checkout = new Checkout(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await waitForSessionCookie(context);
      let guestToken = await getSessionToken(context);
      let user = await registerClient(guestToken);
      let username = user.email;
      let password = user.password;
      await getClientToken(page, username, password);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
    });

    test("BillingSummary card is visible at checkout", async ({
      page,
      context
    }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      await expect(checkout.addNewAddress).toBeVisible();
    });

    test("Summary displays selected address", async ({ page, context }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      await checkout.billingDetails.waitFor();
      let token = await getSessionToken(context);
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      let client = order?.client_id as string;
      let address = await addAddressToClient(token, client);
      let addressId = address?.id as string;
      await setOrderAddress(token, orderId, addressId);
      await page.reload();
      await page.waitForURL("**/order/checkout**");
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      // The address title is carried in billing-summary-address's
      // data-test-value; addAddressToClient seeds "10 Downing Street" as the
      // address name / line 1.
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
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      await checkout.billingDetails.waitFor();
      let token = await getSessionToken(context);
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      let client = order?.client_id as string;
      let address = await addAddressToClient(token, client);
      let addressId = address?.id as string;
      await setOrderAddress(token, orderId, addressId);
      await page.reload();
      await page.waitForURL("**/order/checkout**");
      await expect(checkout.billingSummaryChangeLink).toBeVisible({
        timeout: 15000
      });
      await checkout.billingSummaryChangeLink.click();
      await page.waitForURL("**/order/basket/**/billing/**");
      await expect(checkout.billingCards).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Checkout - Inline Mode (billingDetailsDisabled)", () => {
    test.beforeEach(async ({ page, context }) => {
      checkout = new Checkout(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await waitForSessionCookie(context);
      let guestToken = await getSessionToken(context);
      let user = await registerClient(guestToken);
      let username = user.email;
      let password = user.password;
      await getClientToken(page, username, password);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": true
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
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
      await waitForSessionCookie(context);
      let guestToken = await getSessionToken(context);
      let user = await registerClient(guestToken);
      let username = user.email;
      let password = user.password;
      await getClientToken(page, username, password);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
    });

    test("Billing page loads at /order/basket/billing/", async ({ page }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
    });

    test("'Back to basket' link navigates back", async ({ page }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.backToBasket).toBeVisible({ timeout: 15000 });
      await billingPage.backToBasket.click();
      await page.waitForURL("**/order/basket**");
      await expect(page).toHaveURL("/order/basket/");
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
      await page.waitForURL("**/order/checkout**");
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

    // @quarantine(FE-2784, 2026-06-28)
    // Billing-details cluster on the shared raw-HTTP/FE-2784 setup; tab
    // switching flakes under the stale-cache account state.
    test.skip("Personal/Business tab switching", async ({ page, context }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await expect(billingPage.personalTab).toBeVisible();
      await expect(billingPage.businessTab).toBeVisible();
      await billingPage.businessTab.click();
      await expect(billingPage.companyName).toBeVisible({ timeout: 5000 });
      await billingPage.personalTab.click();
    });
  });

  test.describe("Navigation: Checkout → Billing → Checkout", () => {
    test.beforeEach(async ({ page, context }) => {
      checkout = new Checkout(page);
      billingPage = new BillingPage(page);
      registration = new Registration(page, context);
      await page.goto("/");
      await waitForSessionCookie(context);
      let guestToken = await getSessionToken(context);
      let user = await registerClient(guestToken);
      let username = user.email;
      let password = user.password;
      await getClientToken(page, username, password);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      let token = await getSessionToken(context);
      let order = await getCurrentOrder(token);
      let client = order?.client_id;
      await addAddressToClient(token, client);
      await page.reload();
      await page.waitForURL("**/order/checkout**");
    });

    // @quarantine(FE-2784, 2026-06-28)
    test.skip("Round-trip: update address on billing page", async ({
      page,
      context
    }) => {
      await expect(checkout.billingSummaryChangeLink).toBeVisible({
        timeout: 15000
      });
      await checkout.billingSummaryChangeLink.click();
      await page.waitForURL("**/order/basket/**/billing/**");
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await expect(billingPage.personalTab).toBeVisible();
      await billingPage.personalTab.click();
      const changeLink = page.getByTestId("link-edit");
      await expect(changeLink).toBeVisible();
      await changeLink.click();
      await billingPage.addressLine1.fill("15 White Hart Lane");
      await billingPage.city.fill("Manchester");
      await billingPage.postCode.fill("M1 1AA");
      await checkout.clickSaveDetails();
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

    // @quarantine(FE-2784, 2026-06-28)
    test.skip("Round-trip: add company on billing page", async ({ page }) => {
      await expect(checkout.billingSummaryChangeLink).toBeVisible({
        timeout: 15000
      });
      await checkout.billingSummaryChangeLink.click();
      await page.waitForURL("**/order/basket/**/billing/**");
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await expect(billingPage.businessTab).toBeVisible();
      await billingPage.businessTab.click();
      await expect(billingPage.companyName).toBeVisible();
      await billingPage.companyName.fill("E2E Test Company Ltd");
      await checkout.clickSaveDetails();
      await billingPage.backToBasket.click();
      await page.waitForURL("**/order/basket/**");
      await page.goto(URLs.checkout);
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
      await waitForSessionCookie(context);
      let guestToken = await getSessionToken(context);
      let user = await registerClient(guestToken);
      let username = user.email;
      let password = user.password;
      await getClientToken(page, username, password);
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await page.waitForURL("**/order/checkout/**");
      const token = await getSessionToken(context);
      interceptConfigValues(page, token, {
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
      await waitForSessionCookie(context);
      let guestToken = await getSessionToken(context);
      let user = await registerClient(guestToken);
      let username = user.email;
      let password = user.password;
      let session = await getClientToken(page, username, password);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await page.waitForURL("**/order/checkout/**");
      let token = session?.access_token;
      interceptConfigValues(page, token, {
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
      await waitForSessionCookie(context);
      let guestToken = await getSessionToken(context);
      let user = await registerClient(guestToken);
      let username = user.email;
      let password = user.password;
      let session = await getClientToken(page, username, password);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await page.waitForURL("**/order/checkout/**");
      let token = session?.access_token;
      interceptConfigValues(page, token, {
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
      await waitForSessionCookie(context);
      const guestToken = await getSessionToken(context);
      const user = await registerClient(guestToken);
      await getClientToken(page, user.email, user.password);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
    });

    test("Continue button is hidden for first-time clients with no saved address or company", async ({
      page
    }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      expect(await billingPage.continueIsHidden()).toBe(true);
    });

    // @quarantine(FE-2784, 2026-06-28)
    test.skip("Continue button is rendered once the client has at least one saved address", async ({
      page,
      context
    }) => {
      const token = await getSessionToken(context);
      const order = await getCurrentOrder(token);
      await addAddressToClient(token, order?.client_id as string);

      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      await expect(billingPage.continue).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("FE-2457: Navigation Billing → Product Setup → Checkout", () => {
    // @quarantine(FE-2784, 2026-06-28)
    test.skip("billing → product-setup → checkout chain works end-to-end", async ({
      page,
      context
    }) => {
      const basket = new Basket(page);
      const productConfig = new ProductConfig(page);
      const productSetup = new ProductSetup(page);
      checkout = new Checkout(page);

      const token = await loginAsIncompleteCustomer(page, context);
      await seedInvalidProduct(products.DOMAIN_2, token);

      await page.goto(URLs.basket);
      await basket.proceedToCheckout.click();
      await page.waitForURL(/products-setup/, { timeout: 15000 });
      await fillRegistrantDetails(productConfig);
      await productSetup.submit();
      await page.waitForURL(/checkout/);
      await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
      await checkout.clickCompleteCheckout();
      await expect(page.getByTestId("order-confirmation-heading")).toBeVisible({
        timeout: 30000
      });
    });
  });

  test.describe("Access Control", () => {
    test("Billing page requires authentication", async ({ page }) => {
      await page.goto(URLs.billing);
      await waitForSessionCookie(page.context());
      // Match pathname only — the previous regex also matched the
      // `?returnUrl=/order/basket/billing/` querystring tail on the
      // redirect-to-register flow.
      await expect(page).not.toHaveURL(url =>
        /\/order\/basket\/(?:[^/]+\/)?billing\/?$/.test(url.pathname)
      );
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
        await expect(page).not.toHaveURL(
          /\/order\/basket\/(?:[^/]+\/)?billing\//
        );
      }
    );
  });
});
