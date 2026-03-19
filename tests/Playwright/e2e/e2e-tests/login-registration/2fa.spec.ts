import { test, expect } from "@playwright/test";
import { Secret, TOTP } from "otpauth";
import { URLs } from "../../support/constants/urls";
import { Login } from "../../support/page-objects/templates/login";
import { Logins } from "../../support/constants/logins";
//import { secretKey } from "../../support/secrets/2fa-secret";
let login: Login;
let oneTimeCode: string;

test.describe("Two-Factor Login", async () => {
  test.beforeEach(async ({ page }) => {
    login = new Login(page);
    const twoFactor = new TOTP({
      secret:
        "T6IKOFGR7UD4KV4NQYPN4Q5YOWII44B7MKV4TJVLZFYEKVTT4TLVXHZUY42X4HOUPNO26HALDURQZOP7ZDGP3R2ST6CQJ3XWWADTNJI",
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
    await login.twoFactorInput.fill(oneTimeCode);
    await login.loginButton.click();
    await expect(page).toHaveURL(URLs.emptyBasket);
  });
  test("Unsuccessful login with 2FA", async ({ page }) => {
    await login.twoFactorInput.fill("123456");
    await login.loginButton.click();
    await expect(page.getByTestId("form-item-message-token")).toHaveText(
      "Invalid or expired two-factor auth code"
    );
  });
});
