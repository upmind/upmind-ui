import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { Login } from "../../support/page-objects/templates/Login";
import { Logins } from "../../support/constants/logins";
let login: Login;

test.describe("Login", async () => {
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
      await page.waitForURL(URLs.emptyBasket);
    });
    test("Invalid Username", async ({ page }) => {
      await login.inputLogin("invalid-username", Logins.checkoutUser.password);
      await page.waitForLoadState("networkidle");
      await expect(login.alert).toContainText(
        "The user credentials were incorrect."
      );
    });
    test("Invalid Password", async ({ page }) => {
      await login.inputLogin(
        Logins.checkoutUser.username,
        Logins.stripeCard.password
      );
      await page.waitForLoadState("networkidle");
      await expect(login.alert).toContainText(
        "The user credentials were incorrect."
      );
    });
  });
  test.describe("Login via login popover", () => {
    test.beforeEach(({ page }) => {
      login = new Login(page);
      page.goto(URLs.devBlocks);
    });
    test("Successful Login", async ({ page }) => {
      await login.loginFromPopover(
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await expect(page.url()).toBe(URLs.devBlocks);
    });
    test("Invalid Username", async ({ page }) => {
      await login.loginFromPopover(
        "Logins.checkoutUser.username",
        Logins.checkoutUser.password
      );
      await expect(page.url()).toBe(URLs.devBlocks);
      await expect(login.popoverContent.locator(login.alert)).toContainText(
        "The user credentials were incorrect."
      );
    });
    test("Invalid Password", async ({ page }) => {
      await login.loginFromPopover(
        Logins.checkoutUser.username,
        "Logins.checkoutUser.password"
      );
      await expect(page.url()).toBe(URLs.devBlocks);
      await expect(login.popoverContent.locator(login.alert)).toContainText(
        "The user credentials were incorrect."
      );
    });
  });
});
