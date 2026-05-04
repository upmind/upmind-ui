import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { setLocale } from "../support/helpers/locale";
import { Languages as languages } from "../support/constants/languages";
import { waitForSessionCookie } from "../support/helpers";

for (const { language, locale } of languages) {
  test.describe(`Catalogue Visual Regression Tests - ${language}`, () => {
    test.beforeEach(async ({ page }) => {
      // Disable all CSS animations and transitions
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
    test("Catalogue Root - Page 1", async ({ page }) => {
      await page.goto(URLs.catalogueRoot1);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId("product-search")).toBeVisible();
      await expect(page).toHaveScreenshot(`${language}/catalogue-page-1`, {
        mask: [page.locator("img")],
        fullPage: true
      });
    });
    // test('Catalogue Root - Page 2', async ({page}) => {

    // });
    test("Category Page", async ({ page }) => {
      await page.goto(URLs.categoryPage);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId("product-search")).toBeVisible();
      await expect(page).toHaveScreenshot(`${language}/category-page`, {
        mask: [page.locator("img")],
        fullPage: true
      });
    });
    test("Nested Category page", async ({ page }) => {
      await page.goto(URLs.nestedCategoryPage);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId("product-search")).toBeVisible();
      await expect(page).toHaveScreenshot(`${language}/nested-category-page`, {
        mask: [page.locator("img")],
        fullPage: true
      });
    });
    test("Domain Search", async ({ page }) => {
      await page.goto(URLs.catalogueDomainSearch);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page).toHaveScreenshot(
        `${language}/catalogue-domain-search`,
        {
          mask: [page.locator("lord-icon")],
          fullPage: true
        }
      );
    });
  });
}
