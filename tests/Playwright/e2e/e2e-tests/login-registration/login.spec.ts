import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { Login } from "../../support/page-objects/templates/login";
import { Logins } from "../../support/constants/logins";
import { waitForSessionCookie } from "../../support/helpers";
let login: Login;

test.describe("Login", async () => {
  test.describe("Login via /auth/login", () => {
    test.beforeEach(async ({ page }) => {
      login = new Login(page);
      await page.goto(URLs.login);
    });
    test("Successful Login", async ({ page }) => {
      await login.inputLogin(
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await page.waitForLoadState("domcontentloaded");
      await page.waitForURL(URLs.emptyBasket);
    });
    test("Invalid Username", async ({ page }) => {
      await login.inputLogin("invalid-username", Logins.checkoutUser.password);
      await waitForSessionCookie(page.context());
      await expect(login.alert).toContainText(
        "The user credentials were incorrect."
      );
    });
    test("Invalid Password", async ({ page }) => {
      await login.inputLogin(
        Logins.checkoutUser.username,
        Logins.stripeCard.password
      );
      await waitForSessionCookie(page.context());
      await expect(login.alert).toContainText(
        "The user credentials were incorrect."
      );
    });
  });
  test.describe("Login via login popover", () => {
    test.beforeEach(async ({ page }) => {
      login = new Login(page);
      await page.goto(URLs.devBlocks);
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
