import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { getSessionToken } from "../support/utils/functions/tokens";
import {
  getCurrentOrderId,
  addProductToOrder,
  addPromotionToOrder
} from "../support/utils/functions/basket";
import { setLocale } from "../support/utils/functions/locale-helper";
import { Languages as languages } from "../support/constants/languages";

for (const { language, locale } of languages) {
  test.describe(`Basket Visual Regression Tests - ${language}`, () => {
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
    test("Empty Basket", async ({ page }) => {
      await page.goto(URLs.emptyBasket);
      await setLocale(page, locale);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${language}/empty-basket`, {
        mask: [page.locator("lord-icon")]
      });
    });
    test("Basket with single item", async ({ page, context }) => {
      await page.goto(URLs.basket);
      await setLocale(page, locale);
      await page.waitForLoadState("load");
      await page.waitForLoadState("networkidle");
      token = await getSessionToken(context, "guest");
      orderId = await getCurrentOrderId(token);
      await addProductToOrder(
        token,
        orderId,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        { domain: "uitesting.com" },
        []
      );
      await page.goto(URLs.basket);
      await page.waitForLoadState("load");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${language}/basket-with-1-item`);
    });
    test("Basket with multiple items", async ({ page, context }) => {
      await page.goto(URLs.basket);
      await setLocale(page, locale);
      await page.waitForLoadState("load");
      await page.waitForLoadState("networkidle");
      token = await getSessionToken(context, "guest");
      orderId = await getCurrentOrderId(token);
      await addProductToOrder(
        token,
        orderId,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        { domain: "uitesting1.com" },
        []
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
        []
      );
      await page.goto(URLs.basket);
      await page.waitForLoadState("load");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${language}/basket-with-2-items`);
    });
    test("Basket with promotions", async ({ page, context }) => {
      await page.goto(URLs.basket);
      await setLocale(page, locale);
      await page.waitForLoadState("networkidle");
      token = await getSessionToken(context, "guest");
      orderId = await getCurrentOrderId(token);
      await addProductToOrder(
        token,
        orderId,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        { domain: "uitesting1.com" },
        []
      );
      await addPromotionToOrder(orderId, "genericpromo", token);
      await page.reload();
      await page.waitForLoadState("load");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${language}/basket-with-promotion`);
    });
  });
}
