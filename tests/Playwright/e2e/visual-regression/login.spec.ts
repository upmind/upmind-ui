import { test, expect } from "@playwright/test";
import { Login } from "../support/page-objects/templates/login";
import { Logins } from "../support/constants/logins";
import { URLs } from "../support/constants/urls";
import { setLocale } from "../support/helpers/locale";
import { Languages as languages } from "../support/constants/languages";
import { waitForSessionCookie } from "../support/helpers";

let login: Login;

for (const { language, locale } of languages) {
  test.describe(`Login Page Visual Regression Tests - ${language}`, () => {
    test.beforeEach(async ({ page }) => {
      login = new Login(page);
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
    test("Login Page", async ({ page }) => {
      await page.goto(URLs.login);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page).toHaveScreenshot(`${language}/login`);
    });
    test("2FA Entry", async ({ page }) => {
      await page.goto(URLs.login);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await login.inputLogin(
        Logins.twoFactor.username,
        Logins.twoFactor.password
      );
      await waitForSessionCookie(page.context());
      await expect(page).toHaveScreenshot(`${language}/2fa-entry`);
    });
    test("Forgotten Password", async ({ page }) => {
      await page.goto(URLs.forgottenPassword);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page).toHaveScreenshot(`${language}/forgotten-password`);
    });
  });
}
