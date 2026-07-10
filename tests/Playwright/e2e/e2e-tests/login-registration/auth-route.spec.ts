import { test, expect } from "@playwright/test";
import { Secret, TOTP } from "otpauth";
import { URLs } from "../../support/constants/urls";
import { Login } from "../../support/page-objects/templates/login";
import { Logins } from "../../support/constants/logins";
let login: Login;

test.describe("Login Modal", async () => {
  test.beforeEach(async ({ page }) => {
    login = new Login(page);
    await page.goto(`${URLs.starterHosting}auth`);
  });
  test("Successful Login", async ({ page, context }) => {
    await login.inputLogin(
      Logins.checkoutUser.username,
      Logins.checkoutUser.password
    );
    await expect
      .poll(
        async () => {
          const cookies = await context.cookies();
          return cookies.some(c => c.name === "upm_client_session");
        },
        { timeout: 30000 }
      )
      .toBeTruthy();
  });
  test("Unsuccessful Login", async ({ page }) => {
    await login.inputLogin("invalidUsername", "invalidPassword");
    await expect(login.alert).toBeVisible();
  });
  test("Recover Password from drawer", async ({ page }) => {
    await page.getByTestId("forgot-password-link").click();
    await expect(
      page
        .getByTestId("session-form")
        .and(page.locator(`[data-test-value="recover"]`))
    ).toBeVisible();
  });
  test("2FA Login from drawer", async ({ page, context }) => {
    const twoFactor = new TOTP({
      secret:
        "HB5Z632NV3JJ36HCF6XXNLYIPUNNTCHQOGT3A3WELP5B3BEAHFYMAQQIXXZJ5OU7OKXGGSPPESSENSQKG62MIMX3PHCXDXPIWHVUFAI",
      algorithm: "SHA1",
      digits: 6,
      period: 30
    });
    let oneTimeCode = twoFactor.generate();
    await login.inputLogin(
      Logins.twoFactor.username,
      Logins.twoFactor.password
    );
    await login.twoFactorInput.first().pressSequentially(oneTimeCode);
    await expect
      .poll(
        async () => {
          const cookies = await context.cookies();
          return cookies.some(c => c.name === "upm_client_session");
        },
        { timeout: 30000 }
      )
      .toBeTruthy();
  });
});
