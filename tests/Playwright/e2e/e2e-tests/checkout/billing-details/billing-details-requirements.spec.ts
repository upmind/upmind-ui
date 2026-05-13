import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import {
  createOrder,
  Order,
  addProductToOrder
} from "../../../support/api/basket";
import { interceptConfigValues } from "../../../support/mocks/brand";
import { URLs } from "../../../support/constants/urls";
import { getSessionToken, getClientToken } from "../../../support/api/auth";
import { Logins } from "../../../support/constants/logins";
import { waitForSessionCookie } from "../../../support/helpers/session";
let checkout: Checkout;
let token: string;
let orderId: string | null;
test.describe("Verify checkout billing detail requirements", () => {
  // All tests below log in as Logins.brandUser via beforeEach. Serial mode
  // prevents them from racing against each other on the same staging account.
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    await getClientToken(
      page,
      Logins.brandUser.username,
      Logins.brandUser.password
    );
    await page.goto(URLs.basket);
    await waitForSessionCookie(context);
    token = await getSessionToken(context);
    let order = await createOrder(token);
    orderId = order.id;
    await addProductToOrder(
      `${token}`,
      `${orderId}`,
      "3de78642-de53-9714-76df-21208469530d",
      1,
      24,
      [],
      [],
      {
        domain: `${fakerEN_GB.string.alphanumeric({
          length: { min: 3, max: 15 }
        })}.com`
      },
      [],
      true,
      false
    );
    await page.goto(URLs.basket);
    await waitForSessionCookie(page.context());
  });
  test("Address required at checkout", async ({ page, context }) => {
    interceptConfigValues(page, token, {
      requireAddressForOrders: true,
      requireCompanyForOrders: false,
      requireRegionInAddress: false,
      requirePhoneForOrders: false
    });
    await page.goto(URLs.checkout);
    await checkout.selectPaymentMethod("Offline Payment");
    await checkout.completeCheckout.click();
    await checkout.completeCheckout.click();
    await expect(page.getByRole("alert")).toContainText(
      "Please provide the details below in order to proceed."
    );
    await expect(checkout.addNewAddress).toBeVisible();
  });
  test("Company required at checkout", async ({ page }) => {
    interceptConfigValues(page, token, {
      requireAddressForOrders: false,
      requireCompanyForOrders: true,
      requireRegionInAddress: false,
      requirePhoneForOrders: false
    });
    await page.goto(URLs.checkout);
    await checkout.selectPaymentMethod("Offline Payment");
    await checkout.completeCheckout.click();
    await checkout.completeCheckout.click();
    await expect(page.getByRole("alert")).toContainText(
      "Please provide the details below in order to proceed."
    );
    await expect(checkout.addNewCompany).toBeVisible();
  });
  test("Region required on address", async ({ page, context }) => {
    interceptConfigValues(page, token, {
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
    await expect(checkout.addressRegionMessage).toContainText(
      "Region is required"
    );
  });
  test("Phone required at checkout", async ({ page }) => {
    interceptConfigValues(page, token, {
      requireAddressForOrders: false,
      requireCompanyForOrders: false,
      requireRegionInAddress: false,
      requirePhoneForOrders: true
    });
    await page.goto(URLs.checkout);
    await expect(page.getByRole("alert")).toContainText(
      "Please provide the details below in order to proceed."
    );
    await expect(checkout.addNewPhone).toBeVisible();
  });
});
