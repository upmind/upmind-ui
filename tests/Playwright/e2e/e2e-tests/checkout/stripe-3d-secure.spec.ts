import { test, expect, Page } from "@playwright/test";
//import { test } from '../../support/fixtures/test'
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import {
  getCurrentOrderId,
  addProductToOrder
} from "../../support/utils/functions/basket";
import { getSessionToken } from "../../support/utils/functions/tokens";
import { Checkout } from "../../support/page-objects/templates/Checkout";
import { Registration } from "../../support/page-objects/templates/Registration";
import { ThreeDSecureCards } from "../../support/constants/checkout/payment-cards/3dSecureCards";

let checkout: Checkout;
let registration: Registration;

async function getByIdInFrame(page: Page, frameName: string, id: string) {
  const frameLocator = page.frameLocator(`iframe[name="${frameName}"]`);
  return frameLocator.locator(`#${id}`);
}
async function clickButtonByIdInFrame(
  page: Page,
  frameName: string,
  id: string
) {
  await page.waitForSelector(`iframe[name="${frameName}"]`);
  const locator = await getByIdInFrame(page, frameName, id);
  await locator.waitFor({ state: "visible" });
  await locator.click();
}

test.describe("3D Secure Authentication", async () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    registration = new Registration(page, context);
    await page.goto(URLs.login);
  });
  for (const { name, cardNumber, expiryDate, cvcCode } of ThreeDSecureCards) {
    test(`Stripe Cards - ${name}`, async ({ page, context }) => {
      await page.goto(URLs.basket);
      await page.waitForLoadState("networkidle");
      const token = await getSessionToken(context, "guest");
      const orderId = await getCurrentOrderId(token);
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
      await page.goto(URLs.checkout);
      await registration.inputRegistration();
      await checkout.manuallyInputAddress(
        `${fakerEN_GB.location.streetAddress()}`,
        `${fakerEN_GB.location.streetAddress()}`,
        `${fakerEN_GB.location.city()}`,
        "HU15 1EG",
        "07111111111"
      );
      await checkout.selectPaymentMethod("Stripe Payment");
      await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
      await checkout.clickPlaceOrderButton();
      await page.waitForURL("https://hooks.stripe.com/3d_secure_2/hosted**");
      await page.locator("#test-source-authorize-3ds").click();
      await page.waitForURL(
        `http://qa-automation.local:5173/order/${orderId}?payment_success=true`
      );
      await expect(page.getByRole("dialog")).toContainText("Order complete!");
    });
  }
});
