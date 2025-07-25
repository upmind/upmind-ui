import { test, expect } from "@playwright/test";
import { TOTP } from "otpauth";
import { URLs } from "../../support/constants/urls";
import { Login } from "../../support/page-objects/templates/Login";
import { Logins } from "../../support/constants/logins";
import { secretKey } from "../../support/secrets/2fa-secret";
let login: Login;
let oneTimeCode: string;

test.describe("Two-Factor Login", async () => {
  test.beforeEach(async ({ page }) => {
    login = new Login(page);
    const twoFactor = new TOTP({
      secret: secretKey,
      algorithm: "SHA1",
      digits: 6,
      period: 30
    });
    oneTimeCode = twoFactor.generate();
    await page.goto(URLs.login);
    await login.inputLogin(
      Logins.twoFactor.username,
      Logins.twoFactor.password
    );
  });
  test("Successful login with 2FA", async ({ page }) => {
    await page.getByTestId("form-item-token").fill(oneTimeCode);
    await page.getByTestId("button-log-into-my-account").click();
    await expect(page).toHaveURL(URLs.emptyBasket);
  });
  test("Unsuccessful login with 2FA", async ({ page }) => {
    await page.getByTestId("form-item-token").fill("123456");
    await page.getByTestId("button-log-into-my-account").click();
    await expect(page.getByTestId("form-message")).toHaveText(
      "Invalid or expired two-factor auth code"
    );
  });
});
