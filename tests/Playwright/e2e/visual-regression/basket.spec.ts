import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { getSessionToken } from "../support/api/auth";
import {
  createOrder,
  addProductToOrder,
  addPromotionToOrder
} from "../support/api/basket";
import { setLocale } from "../support/helpers/locale";
import { waitForSessionCookie } from "../support/helpers/session";
import { Languages as languages } from "../support/constants/languages";

let token: string;
let orderId: string | null;
test.beforeEach(async ({ page }) => {
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
test.describe("Themes: Mono @themes @mono", () => {});
test.describe("Themes: Dark Mode @themes @dark-mode", () => {});
test.describe("Themes: Hosting.com @themes @hosting", () => {});

for (const { language, locale } of languages) {
  test.describe(`Translations: ${language} @i18n`, () => {
    test("Empty Basket", async ({ page }) => {
      await page.goto(URLs.emptyBasket);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page).toHaveScreenshot(`${language}/empty-basket`, {
        mask: [page.locator("lord-icon")]
      });
    });
    test("Basket with single item", async ({ page, context }) => {
      await page.goto(URLs.basket);
      await setLocale(page, locale);
      await waitForSessionCookie(context);
      token = await getSessionToken(context);
      let order = await createOrder(token);
      let orderId = order.id;
      await addProductToOrder(
        token,
        orderId,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        { domain: "uitesting.com" },
        [],
        true,
        false
      );
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page).toHaveScreenshot(`${language}/basket-with-1-item`);
    });
    test("Basket with multiple items", async ({ page, context }) => {
      await page.goto(URLs.basket);
      await setLocale(page, locale);
      await waitForSessionCookie(context);
      token = await getSessionToken(context);
      let order = await createOrder(token);
      let orderId = order.id;
      await addProductToOrder(
        token,
        orderId,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        { domain: "uitesting1.com" },
        [],
        true,
        false
      );
      await addProductToOrder(
        token,
        orderId,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        { domain: "uitesting2.com" },
        [],
        true,
        false
      );
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page).toHaveScreenshot(`${language}/basket-with-2-items`);
    });
    test("Basket with promotions", async ({ page, context }) => {
      await page.goto(URLs.basket);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      let order = await createOrder(token);
      let orderId = order.id;
      await addProductToOrder(
        token,
        orderId,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        { domain: "uitesting1.com" },
        [],
        true,
        false
      );
      await addPromotionToOrder(orderId, "genericpromo", token);
      await page.reload();
      await page.waitForLoadState("load");
      await waitForSessionCookie(page.context());
      await expect(page).toHaveScreenshot(`${language}/basket-with-promotion`);
    });
  });
}
