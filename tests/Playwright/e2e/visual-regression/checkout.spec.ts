import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { Basket } from "../support/page-objects/templates/basket";
import { Checkout } from "../support/page-objects/templates/checkout";
import { getSessionToken } from "../support/api/auth";
import { getCurrentOrder, addProductToOrder } from "../support/api/basket";
import { getClientToken } from "../support/api/auth";
import { Logins } from "../support/constants/logins";
import { goToCheckout } from "../support/flows/checkout";
import { products } from "../support/constants/products";

let basket: Basket;
let checkout: Checkout;

const localeKeys: (keyof typeof Logins)[] = [
  "english",
  "englishUS",
  "french",
  "german",
  "greek",
  "danish",
  "polish",
  "spanish",
  "portuguese",
  "bulgarian",
  "azerbaijani",
  "dutch",
  "indonesian",
  "norwegian",
  "turkish",
  "ukrainian",
  "urdu",
  "russian",
  "frenchCanada",
  "chinese",
  "spanishLATAM",
  "romanian",
  "czech",
  "slovak",
  "portugueseBrazil",
  "swedish",
  "hungarian"
];

const localeLogins = localeKeys.map(key => ({
  language: key,
  ...Logins[key]
}));

for (const { language, username, password } of localeLogins) {
  test.describe(`Checkout Visual Regression Tests - ${language}`, () => {
    let token: string;
    let order: any | null;
    let orderId: string | null;
    test.beforeEach(async ({ page }) => {
      basket = new Basket(page);
      checkout = new Checkout(page);
      // Disable all CSS animations and transitions
      await page.goto(URLs.emptyBasket);
      await page.waitForLoadState("load");
      await page.addStyleTag({
        content: `
                    *,
                    *::before,
                    *::after {
                        transition: none !important;
                        animation: none !important;
                        caret-color: transparent !important;
                    }
                    `
      });
    });
    test.skip("Checkout - Guest", async ({ page, context }) => {
      await page.goto(URLs.basket);
      await page.waitForLoadState("load");
      await page.waitForLoadState("networkidle");
      token = await getSessionToken(context);
      order = await getCurrentOrder(token);
      orderId = order?.id;
      await addProductToOrder(
        token,
        orderId,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        { domain: "uicheckout.com" },
        [],
        true,
        false
      );
      await page.reload();
      await page.waitForLoadState("networkidle");
      await basket.proceedToCheckout.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${language}/checkout-guest)`, {
        fullPage: true
      });
    });
    test("Checkout - Registered User", async ({ page, context }) => {
      await getClientToken(page, username, password);
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      await page.waitForLoadState("load");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(
        `${language}/checkout-account-user)`,
        { fullPage: true }
      );
    });
  });
}
