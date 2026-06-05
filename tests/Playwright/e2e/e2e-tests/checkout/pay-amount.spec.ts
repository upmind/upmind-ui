import { test, expect } from "@playwright/test";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Registration } from "../../support/page-objects/templates/registration";
import { goToCheckout } from "../../support/flows/checkout";
import { products } from "../../support/constants/products";
import {
  getClientToken,
  getSessionToken,
  registerClient
} from "../../support/api/index";
import {
  expectedPayAmountText,
  waitForSessionCookie
} from "../../support/helpers";

let checkout: Checkout;
let register: Registration;

test.describe("Checkout - Pay Amount", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    register = new Registration(page, context);
    await page.goto("/");
    await waitForSessionCookie(context);
    let guestToken = await getSessionToken(context);
    let user = await registerClient(guestToken);
    let username = user.email;
    let password = user.password;
    await getClientToken(page, username, password);
  });
  test.describe("Pay Amount on Checkout", async () => {
    test("Value on initial load", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      const expected = await expectedPayAmountText(context);
      await expect(checkout.payAmount).toHaveText(expected);
    });
    test("Value with promo applied", async ({ page, context }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        "genericpromo",
        null
      );
      const expected = await expectedPayAmountText(context);
      await expect(checkout.payAmount).toHaveText(expected);
    });
    test("Value in alternate currency", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "INR");
      const expected = await expectedPayAmountText(context);
      await expect(checkout.payAmount).toHaveText(expected);
    });
  });
  test.describe("Changing Pay Amount value", async () => {
    test("Manually update Pay Amount", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("10");
      await checkout.clickConfirmAmount();
      // £10.00 is the user's typed input — literal is correct here
      await expect(checkout.payAmount).toHaveText("Pay £10.00");
    });
    test("Applying a promotion which changes Pay Amount", async ({
      page,
      context
    }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      // Capture the baseline pre-promo total from the API
      const baseline = await expectedPayAmountText(context);
      await expect(checkout.payAmount).toHaveText(baseline);
      // Apply promo via UI
      await checkout.addVoucherButton.click();
      await checkout.addVoucherInput.fill("genericpromo");
      await checkout.applyVoucherButton.click();
      // Promo discounted the total — verify it changed, then check API truth
      await expect(checkout.payAmount).not.toHaveText(baseline);
      const postPromo = await expectedPayAmountText(context);
      await expect(checkout.payAmount).toHaveText(postPromo);
    });
    test("Changing currency of Pay Amount", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await expect(checkout.billingDetails).toBeVisible();
      await page
        .getByTestId("currency-selector")
        .getByTestId("button-default")
        .click();
      // Wait for dropdown to be stable then click the option
      const audOption = page.getByRole("option", { name: /AUD/i });
      await expect(audOption).toBeVisible();
      await audOption.click({ force: true });
      // Wait for the currency change to take effect (API call)
      await waitForSessionCookie(page.context());
      const expected = await expectedPayAmountText(context);
      await expect(checkout.payAmount).toHaveText(expected);
    });
  });
});
