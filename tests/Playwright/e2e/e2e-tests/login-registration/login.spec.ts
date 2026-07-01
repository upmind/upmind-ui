import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { Login } from "../../support/page-objects/templates/login";
import { Logins } from "../../support/constants/logins";
import { waitForSessionCookie } from "../../support/helpers";
let login: Login;

test.describe("Login", async () => {
  // The Successful Login tests in both inner describes authenticate as
  // Logins.checkoutUser, which is also used in
  // checkout/billing-details/update-billing-details.spec.ts. Serial mode
  // prevents them from racing against each other on the same staging account.
  test.describe.configure({ mode: "serial" });
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
      await page.waitForURL(URLs.emptyBasket);
    });
    test("Invalid Username", async ({ page }) => {
      await login.inputLogin("invalid-username", Logins.checkoutUser.password);
      await waitForSessionCookie(page.context());
      await expect(login.alert).toBeVisible();
    });
    test("Invalid Password", async ({ page }) => {
      await login.inputLogin(
        Logins.checkoutUser.username,
        Logins.stripeCard.password
      );
      await waitForSessionCookie(page.context());
      await expect(login.alert).toBeVisible();
    });
    test("Password field is the quiet variant (no meter, no generator)", async ({
      page
    }) => {
      const passwordItem = page.getByTestId("form-item-password");
      await expect(login.passwordField).toBeVisible();
      await expect(passwordItem.getByTestId("password-generate")).toHaveCount(
        0
      );
      await expect(passwordItem.getByTestId("password-toggle")).toBeVisible();

      await login.passwordField.fill("anything-goes");
      await expect(passwordItem.getByTestId("password-strength")).toHaveCount(
        0
      );
      await expect(passwordItem.getByTestId("password-message")).toHaveCount(0);
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
      await expect(login.popoverContent.locator(login.alert)).toBeVisible();
    });
    test("Invalid Password", async ({ page }) => {
      await login.loginFromPopover(
        Logins.checkoutUser.username,
        "Logins.checkoutUser.password"
      );
      await expect(page.url()).toBe(URLs.devBlocks);
      await expect(login.popoverContent.locator(login.alert)).toBeVisible();
    });
  });
});
