import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/Urls";
import { Login } from "../support/page-objects/templates/Login";
import { Logins } from "../support/constants/Logins";
let login: Login;

test.describe("Login", () => {
  test.describe("Login via /auth/login", () => {
    test.beforeEach(({ page }) => {
      login = new Login(page);
      page.goto(URLs.login);
    });
    test("Successful Login", async ({ page }) => {
      await login.inputLogin(
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(URLs.emptyBasket);
    });
    test("Invalid Username", async ({ page }) => {
      await login.inputLogin("invalid-username", Logins.checkoutUser.password);
      await page.waitForLoadState("networkidle");
      await expect("error message").toContain("Invalid Username");
    });
    test("Invalid Password", async ({ page }) => {
      await login.inputLogin(
        Logins.checkoutUser.username,
        Logins.stripeCard.password
      );
      await page.waitForLoadState("networkidle");
      await expect("error message").toContain("Invalid Password");
    });
  });
  test.describe("Login via login popover", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(URLs.devBlocks);
      await page.waitForLoadState("networkidle");
    });
    test("Successful Login", async ({ page }) => {
      await login.loginFromPopover(
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await expect(page.url()).toBe(URLs.emptyBasket);
    });
    test("Invalid Username", async ({ page }) => {
      await login.loginFromPopover(
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await expect(page.url()).toBe(URLs.devBlocks);
      await expect(login.popoverContent.locator(login.alert)).toContainText("");
    });
    test("Invalid Password", async ({ page }) => {
      await login.loginFromPopover(
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await expect(page.url()).toBe(URLs.devBlocks);
      await expect(login.popoverContent.locator(login.alert)).toContainText("");
    });
  });
});
