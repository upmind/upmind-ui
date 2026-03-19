import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { setLocale } from "../support/helpers/locale";
import { Languages as languages } from "../support/constants/languages";

for (const { language, locale } of languages) {
  test.describe(`Registration Page Visual Regression Tests - ${language}`, () => {
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
    test("Registration Page", async ({ page }) => {
      await page.goto(URLs.register);
      await setLocale(page, locale);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${language}/registration`);
    });
  });
}
