import { Page, Locator } from "@playwright/test";

/**
 * Locators for the email-verification interstitial (FE-1329).
 *
 * The verify form reuses the shared `Auth` component, so the code input and the
 * error alert share the 2fa/login testids (`input-otp-slot`, `auth-alert`), and
 * an invalid code surfaces as a field-level message (`form-item-message-code`),
 * mirroring 2fa's `form-item-message-token`. The resend control + its status copy
 * carry their own testids (`resend-code-link` / `resend-sent`).
 */
export class VerifyEmail {
  readonly page: Page;
  readonly title: Locator;
  readonly otpInput: Locator;
  readonly alert: Locator;
  readonly codeFieldError: Locator;
  readonly resendLink: Locator;
  readonly resentMessage: Locator;
  readonly backToBasket: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId("verify-email-heading");
    this.otpInput = page.getByTestId("input-otp-slot");
    this.alert = page.getByTestId("auth-alert");
    this.codeFieldError = page.getByTestId("form-item-message-code");
    this.resendLink = page.getByTestId("resend-code-link");
    this.resentMessage = page.getByTestId("resend-sent");
    this.backToBasket = page.getByTestId("link-back-to-basket");
  }

  /** Enter the verification code into the OTP slots (the form auto-submits once valid). */
  async enterCode(code: string) {
    await this.otpInput.first().pressSequentially(code);
  }
}
