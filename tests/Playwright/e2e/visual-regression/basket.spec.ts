import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import {
  addProductViaHeadless,
  addPromotionViaHeadless
} from "../support/flows/basket-setup";
import { setLocale } from "../support/helpers/locale";
import { waitForSessionCookie } from "../support/helpers/session";
import { Languages as languages } from "../support/constants/languages";

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
      await expect(page.getByTestId("basket-empty-message")).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`${language}/empty-basket`, {
        // Mask the avatar CONTAINER (static testid) — the icon inside
        // nondeterministically renders as a lottie web component or an img
        // fallback, so lord-icon is not a stable mask target.
        mask: [page.getByTestId("interstitial-avatar")]
      });
    });
    test("Basket with single item", async ({ page }) => {
      await page.goto(URLs.basket);
      await setLocale(page, locale);
      await addProductViaHeadless(page, {
        productId: "3de78642-de53-9714-76df-21208469530d",
        quantity: 1,
        billingCycleMonths: 24,
        provisionFields: { domain: "uitesting.com" }
      });
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId("basket-product").first()).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`${language}/basket-with-1-item`);
    });
    test("Basket with multiple items", async ({ page }) => {
      await page.goto(URLs.basket);
      await setLocale(page, locale);
      await addProductViaHeadless(page, {
        productId: "3de78642-de53-9714-76df-21208469530d",
        quantity: 1,
        billingCycleMonths: 24,
        provisionFields: { domain: "uitesting1.com" }
      });
      await addProductViaHeadless(page, {
        productId: "3de78642-de53-9714-76df-21208469530d",
        quantity: 1,
        billingCycleMonths: 24,
        provisionFields: { domain: "uitesting2.com" }
      });
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      const basketProducts = page.getByTestId("basket-product");
      await expect(basketProducts).toHaveCount(2, { timeout: 15000 });
      await expect(basketProducts.last()).toBeVisible();
      await expect(page).toHaveScreenshot(`${language}/basket-with-2-items`);
    });
    test("Basket with promotions", async ({ page }) => {
      await page.goto(URLs.basket);
      await setLocale(page, locale);
      await addProductViaHeadless(page, {
        productId: "3de78642-de53-9714-76df-21208469530d",
        quantity: 1,
        billingCycleMonths: 24,
        provisionFields: { domain: "uitesting1.com" }
      });
      await addPromotionViaHeadless(page, "genericpromo");
      await page.reload();
      await page.waitForLoadState("load");
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId("basket-product").first()).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`${language}/basket-with-promotion`);
    });
  });
}
