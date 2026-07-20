import { test, expect } from "@playwright/test";
import { Secret, TOTP } from "otpauth";
import { URLs } from "../../support/constants/urls";
import { Login } from "../../support/page-objects/templates/login";
import { Logins } from "../../support/constants/logins";
import {
  mockTwoFactorVerifySuccess,
  mockEmailTwoFactorChallenge
} from "../../support/mocks/two-factor";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Two-factor login e2e coverage.
 *
 * Two providers, one deliberate asymmetry (FE-2638): when a verify fails, the
 * TOTP path *retains* the entered code (the authenticator app still shows it)
 * while the EMAIL path *clears* it (the old code is dead — a fresh one must be
 * re-typed from the next email). The `Two-Factor Login` (TOTP) and
 * `Email Two-Factor Login` (EMAIL) blocks below lock in both halves so the
 * asymmetry can't silently regress.
 *
 * ## Why EMAIL is driven through a mocked challenge (FE-2794)
 * The `clear2faToken` guard fires only when the challenge token's
 * `twofa_provider` is exactly `"Email"` (auth.machine `isEmailTwofa`). But
 * per-user EMAIL 2FA does not exist: a user's 2FA is always TOTP, and the EMAIL
 * provider is a brand-wide switch that is forbidden on staging — so NO real
 * staging account can return `"Email"` (verified: a real `grant_type=password`
 * login resolves to `twofa_provider: "TOTP"`). The EMAIL block therefore mocks
 * ONLY the login CHALLENGE: a real `Logins.twoFactor` grant_type=password
 * response captured from staging with its single provider field flipped
 * TOTP→Email (see `mocks/two-factor.ts`). Everything after the challenge stays
 * real — the wrong-code verify below is rejected by the genuine oauth endpoint,
 * so the clear-on-fail it asserts is the real frontend path, not a mocked
 * outcome. The machine is deliberately not touched.
 *
 * ## ⚠️ Documented P4 exception (EMAIL happy path only)
 * EMAIL 2FA sends a random, server-issued code by email and there is no
 * test-inbox, so the success path can't be driven with real data. Per the
 * owner's directive (no mail-catcher, no mail reading) the EMAIL happy path
 * additionally mocks the `grant_type=twofa` verify response (see
 * `mocks/two-factor.ts`), layered on the mocked challenge; only the code entry
 * is simulated. The FAILURE path mocks the challenge only and lets the verify
 * fail for real.
 */
// -----------------------------------------------------------------------------

// Reads a live OTP slot group as the string a user would see across the slots,
// so emptied-vs-retained is asserted on the real rendered field, not internals.
const otpFieldValue = (login: Login) =>
  login.twoFactorInput.evaluateAll(slots =>
    slots.map(slot => (slot as HTMLInputElement).value).join("")
  );

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
    await expect(page.getByTestId("basket-empty-message")).toBeVisible();
  });
  test("Unsuccessful login with 2FA", async () => {
    await login.twoFactorInput.first().pressSequentially("123456");
    await expect(
      login.page
        .getByTestId("form-item-message")
        .and(login.page.locator(`[data-test-value="token"]`))
    ).toBeVisible();
    // TOTP asymmetry (FE-2638): the failed code is RETAINED, not cleared — the
    // authenticator still shows it, so the user can correct/resubmit. Contrast
    // the EMAIL block, where the same failure empties the field.
    await expect.poll(() => otpFieldValue(login)).toBe("123456");
  });
});

test.describe("Email Two-Factor Login", async () => {
  // Serialised so the two tests don't race their per-test route setup and the
  // OTP-gate teardown on the shared `login` handle.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    login = new Login(page);
    // Mock ONLY the login challenge so the flow enters 2FA as the EMAIL provider
    // — a state no real staging account can produce (see fileoverview +
    // mocks/two-factor.ts). The verify that follows is left to the real API.
    await mockEmailTwoFactorChallenge(page);
    await page.goto(URLs.login);
    await login.inputLogin(
      Logins.twoFactor.username,
      Logins.twoFactor.password
    );
    // The (mocked) login hands off to the EMAIL 2FA challenge; the OTP field is
    // now the gate.
    await expect(login.twoFactorInput.first()).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  test("A wrong code shows an error and clears the OTP field (FE-2638)", async () => {
    await login.twoFactorInput.first().pressSequentially("123456");

    // The real verify rejects the code and the error surfaces on the field.
    await expect(
      login.page
        .getByTestId("form-item-message")
        .and(login.page.locator(`[data-test-value="token"]`))
    ).toBeVisible();

    // EMAIL asymmetry (FE-2638): clear2faToken fires on the EMAIL provider
    // path, emptying every slot so the dead code can't be resubmitted.
    await expect.poll(() => otpFieldValue(login)).toBe("");
  });

  test("A valid code logs the client in", async ({ page }) => {
    // Owner's directive: no mail reading — stub the twofa verify response too,
    // layered on top of the mocked challenge from beforeEach.
    await mockTwoFactorVerifySuccess(page);

    await login.twoFactorInput.first().pressSequentially("123456");

    // A successful verify satisfies the challenge and dismisses the OTP gate.
    await expect(login.twoFactorInput).toHaveCount(0);
  });
});
