import { expect, test } from "@playwright/test";
import { newUser } from "../../../support/fixtures";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { BillingPage } from "../../../support/page-objects/templates/billing-page";
import { URLs } from "../../../support/constants/urls";
import { goToCheckout } from "../../../support/flows/checkout";
import { addAddressToClient } from "../../../support/api/client";
import { products } from "../../../support/constants/products";
import {
  interceptUISchema,
  interceptConfigValues
} from "../../../support/mocks/brand";
import { getSessionToken, getClientToken } from "../../../support/api/auth";
import { Registration } from "../../../support/page-objects/templates/registration";
import { getCurrentOrder, setOrderAddress } from "../../../support/api/basket";
import { registerClient } from "../../../support/api/client";
import { waitForSessionCookie } from "../../../support/helpers/session";

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

    test("1.1 BillingSummary card is visible at checkout", async ({
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

    test("1.2 Summary displays selected address", async ({ page, context }) => {
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
      await expect(checkout.billingDetails).toHaveText(
        /10 Downing Street*London*Greater London*SW1A 2AB*United Kingdom/s
      );
    });

    test("1.3 'Change' link navigates to billing page", async ({
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
      await page.waitForURL("**/order/billing**");
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

    test("2.1 Inline billing form shown when standalone is disabled", async () => {
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

    test("3.1 Billing page loads at /order/billing", async ({ page }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
    });

    test("3.2 'Back to basket' link navigates back", async ({ page }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.backToBasket).toBeVisible({ timeout: 15000 });
      await billingPage.backToBasket.click();
      await page.waitForURL("**/order/basket**");
      await expect(page).toHaveURL("/order/basket/");
    });

    test("3.3 Can add new address on billing page", async ({ page }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      if (await billingPage.personalTab.isVisible()) {
        await billingPage.personalTab.click();
      }
      await billingPage.manuallyInputAddress(
        "10 Downing Street",
        "London",
        "SW1A 2AB"
      );
      await billingPage.saveDetails.click();
      await page.waitForURL("**/order/checkout**");
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      await expect(checkout.billingDetails).toHaveText(
        /10 Downing Street.*London.*SW1A 2AA.*United Kingdom/s
      );
    });

    test("3.4 Personal/Business tab switching", async ({ page, context }) => {
      await page.goto(URLs.billing);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      if (
        (await billingPage.personalTab.isVisible()) &&
        (await billingPage.businessTab.isVisible())
      ) {
        await billingPage.businessTab.click();
        await expect(billingPage.companyName).toBeVisible({ timeout: 5000 });
        await billingPage.personalTab.click();
      }
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

    test("4.1 Round-trip: update address on billing page", async ({
      page,
      context
    }) => {
      await expect(checkout.billingSummaryChangeLink).toBeVisible({
        timeout: 15000
      });
      await checkout.billingSummaryChangeLink.click();
      await page.waitForURL("**/order/billing**");
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      if (await billingPage.personalTab.isVisible()) {
        await billingPage.personalTab.click();
      }
      const changeLink = page.getByTestId("link-edit");
      await changeLink.isVisible();
      await changeLink.click();
      await billingPage.addressLine1.fill("15 White Hart Lane");
      await billingPage.city.fill("Manchester");
      await billingPage.postCode.fill("M1 1AA");
      await page.waitForTimeout(1000);
      await checkout.clickSaveDetails();
      await billingPage.continue.click();
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      await expect(checkout.billingDetails).toContainText("15 White Hart Lane");
      await expect(checkout.billingDetails).toContainText("Manchester");
      await expect(checkout.billingDetails).toContainText("M1 1AA");
    });

    test("4.2 Round-trip: add company on billing page", async ({ page }) => {
      await expect(checkout.billingSummaryChangeLink).toBeVisible({
        timeout: 15000
      });
      await checkout.billingSummaryChangeLink.click();
      await page.waitForURL("**/order/billing**");
      await expect(billingPage.billingSection).toBeVisible({ timeout: 15000 });
      if (await billingPage.businessTab.isVisible()) {
        await billingPage.businessTab.click();
      }
      if (await billingPage.companyName.isVisible()) {
        await billingPage.companyName.fill("E2E Test Company Ltd");
      }
      await page.waitForTimeout(1000);
      await checkout.clickSaveDetails();
      await billingPage.backToBasket.click();
      await page.waitForURL("**/order/basket/**");
      await page.goto(URLs.checkout);
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Missing Billing Data", () => {
    test("5.1 'Add address' link when address required but missing", async ({
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

    test("5.2 'Add company' link when company required but missing", async ({
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

    test("5.3 'Add number' link when phone required but missing", async ({
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

  test.describe("Access Control", () => {
    test("6.1 Billing page requires authentication", async ({ page }) => {
      await page.goto(URLs.billing);
      await waitForSessionCookie(page.context());
      await expect(page).not.toHaveURL("order/billing/");
    });

    newUser(
      "6.2 Billing page requires basket with products",
      async ({ page, context }) => {
        await page.goto("/");
        await waitForSessionCookie(context);
        interceptUISchema(context, {
          "@data.billing_details.billingDetailsDisabled": false
        });
        await page.goto(URLs.billing);
        await waitForSessionCookie(page.context());
        await expect(page).not.toHaveURL("order/billing/");
      }
    );
  });
});
