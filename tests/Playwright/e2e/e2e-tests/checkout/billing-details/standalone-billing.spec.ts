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
      await expect(checkout.billingDetails).toHaveText(
        /10 Downing Street*London*Greater London*SW1A 2AB*United Kingdom/s
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
      await billingPage.saveDetails.click();
      await page.waitForURL("**/order/checkout**");
      await expect(checkout.billingDetails).toBeVisible({ timeout: 15000 });
      await expect(checkout.billingDetails).toHaveText(
        /10 Downing Street.*London.*SW1A 2AA.*United Kingdom/s
      );
    });

    test("Personal/Business tab switching", async ({ page, context }) => {
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

    test("Round-trip: update address on billing page", async ({
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
      await expect(checkout.billingDetails).toContainText("15 White Hart Lane");
      await expect(checkout.billingDetails).toContainText("Manchester");
      await expect(checkout.billingDetails).toContainText("M1 1AA");
    });

    test("Round-trip: add company on billing page", async ({ page }) => {
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

    test("Continue button is rendered once the client has at least one saved address", async ({
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
    test("billing → product-setup → checkout chain works end-to-end", async ({
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
      await checkout.selectPaymentMethod("Direct Bank Transfer");
      await checkout.clickCompleteCheckout();
      await expect(page.getByText("Order confirmed")).toBeVisible({
        timeout: 30000
      });
    });
  });

  test.describe("Access Control", () => {
    test("Billing page requires authentication", async ({ page }) => {
      await page.goto(URLs.billing);
      await waitForSessionCookie(page.context());
      await expect(page).not.toHaveURL(
        /\/order\/basket\/(?:[^/]+\/)?billing\//
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
