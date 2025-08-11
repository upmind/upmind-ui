import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Checkout } from "../../support/page-objects/templates/Checkout";
import {
  getCurrentOrderId,
  addProductToOrder
} from "../../support/utils/functions/basket";
import { interceptConfigValues } from "../../support/utils/functions/brand";
import { URLs } from "../../support/constants/urls";
import {
  getSessionToken,
  getClientToken
} from "../../support/utils/functions/tokens";
import { Logins } from "../../support/constants/logins";
let checkout: Checkout;
let token: string;
let orderId: string | null;
test.describe("Verify checkout billing detail requirements", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    await getClientToken(
      page,
      Logins.brandUser.username,
      Logins.brandUser.password
    );
    token = await getSessionToken(context, "client");
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    orderId = await getCurrentOrderId(token);
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
      []
    );
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
  });
  test("Address required at checkout", async ({ page, context }) => {
    await interceptConfigValues(page, token, {
      requireAddressForOrders: true,
      requireCompanyForOrders: false,
      requireRegionInAddress: false,
      requirePhoneForOrders: false
    });
    await page.goto(URLs.checkout);
    await expect(
      page.getByTestId("form-item-message-company-address")
    ).toContainText("Address is required");
  });
  test("Company required at checkout", async ({ page, context }) => {
    await interceptConfigValues(page, token, {
      requireAddressForOrders: false,
      requireCompanyForOrders: true,
      requireRegionInAddress: false,
      requirePhoneForOrders: false
    });
    await page.goto(URLs.checkout);
    await expect(
      page.getByTestId("form-item-message-company-name")
    ).toContainText("must be string");
  });
  test("Region required on address", async ({ page, context }) => {
    await interceptConfigValues(page, token, {
      requireAddressForOrders: true,
      requireCompanyForOrders: false,
      requireRegionInAddress: true,
      requirePhoneForOrders: false
    });
    await page.goto(URLs.checkout);
    await checkout.manuallyInputAddress(
      `${fakerEN_GB.location.streetAddress()}`,
      `${fakerEN_GB.location.streetAddress()}`,
      `${fakerEN_GB.location.city()}`,
      "HU15 1EG",
      null
    );
    await expect(
      page.getByTestId("form-item-message-address-regionId")
    ).toContainText("must have required property 'regionId'");
  });
  test("Phone required at checkout", async ({ page, context }) => {
    await interceptConfigValues(page, token, {
      requireAddressForOrders: false,
      requireCompanyForOrders: false,
      requireRegionInAddress: false,
      requirePhoneForOrders: true
    });
    await page.goto(URLs.checkout);
    await expect(
      page.getByTestId("form-item-message-address-phone")
    ).toContainText("Phone is required");
  });
});
