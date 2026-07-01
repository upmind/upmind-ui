import { test, expect } from "@playwright/test";
import { Secret, TOTP } from "otpauth";
import { URLs } from "../../support/constants/urls";
import { Login } from "../../support/page-objects/templates/login";
import { Logins } from "../../support/constants/logins";

let login: Login;
let oneTimeCode: string;

test.describe("Two-Factor Login", async () => {
  // Both tests below log in as Logins.twoFactor via beforeEach, which is also
  // used in visual-regression/login.spec.ts. Serial mode prevents them from
  // racing against each other on the same staging account.
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    login = new Login(page);

    const twoFactor = new TOTP({
      secret:
        "HB5Z632NV3JJ36HCF6XXNLYIPUNNTCHQOGT3A3WELP5B3BEAHFYMAQQIXXZJ5OU7OKXGGSPPESSENSQKG62MIMX3PHCXDXPIWHVUFAI",
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
    await login.twoFactorInput.first().pressSequentially(oneTimeCode);
    await expect(page).toHaveURL(URLs.emptyBasket);
  });
  test("Unsuccessful login with 2FA", async ({ page }) => {
    await login.twoFactorInput.first().pressSequentially("123456");
    await expect(page.getByTestId("form-item-message-token")).toBeVisible();
  });
});
