import { Page, Locator, BrowserContext } from "@playwright/test";
import { faker } from "@faker-js/faker";

// Default password for tests that just need a value satisfying the registration
// schema (≥8 chars, letter, digit, symbol — see FE-2661).
export const STRONG_PASSWORD = "Password1!";

export class Registration {
  readonly page: Page;
  readonly registrationForm: Locator;
  readonly context?: BrowserContext;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly passwordItem: Locator;
  readonly passwordMessage: Locator;
  readonly passwordStrengthBars: Locator;
  readonly passwordGenerator: Locator;
  readonly passwordToggle: Locator;

  constructor(page: Page, context?: BrowserContext) {
    this.page = page;
    this.registrationForm = page.getByTestId("register-form");
    this.context = context;
    this.firstName = page
      .getByTestId("input")
      .and(page.locator('[data-test-value="properties-firstname"]'));
    this.lastName = page
      .getByTestId("input")
      .and(page.locator('[data-test-value="properties-lastname"]'));
    this.email = page
      .getByTestId("input")
      .and(page.locator('[data-test-value="properties-username"]'));
    this.passwordItem = page
      .getByTestId("form-item")
      .and(page.locator('[data-test-value="password"]'));
    this.password = this.passwordItem.getByRole("textbox");
    this.passwordMessage = this.passwordItem.getByTestId("password-message");
    this.passwordStrengthBars = this.passwordItem
      .getByTestId("password-strength")
      .locator("> div");
    this.passwordGenerator = this.passwordItem.getByTestId("password-generate");
    this.passwordToggle = this.passwordItem.getByTestId("password-toggle");
  }

  /**
   * @param field - Stable field name (a JSONForms scope key, e.g. `username`),
   *   NOT a translated label. FormField renders the message testid as
   *   `form-item-message-${name.replaceAll('.', '-')}`.
   */
  getValidationError(field: string) {
    if (field === "password") return this.passwordMessage;
    return this.page
      .getByTestId("form-item-message")
      .and(
        this.page.locator(`[data-test-value="${field.replaceAll(".", "-")}"]`)
      );
  }

  /**
   * Fills and submits the registration form with fresh faker details.
   * Returns the generated credentials so callers can assert they reached the
   * wire (the register POST payload), not just that a session cookie appeared.
   */
  async inputRegistration() {
    const firstName = `${faker.person.firstName()}`;
    const lastName = `${faker.person.lastName()}`;
    const email = `nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`;
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.email.fill(email);
    await this.password.fill(STRONG_PASSWORD);
    await this.page.getByTestId("button-continue").click();
    await this.page.waitForLoadState("networkidle");
    return { firstName, lastName, email };
  }

  async getCookie(tokenType: string) {
    const cookies = await this.page.context().cookies();
    let sessionCookie;
    if (tokenType === "client") {
      sessionCookie = cookies.find(
        cookie => cookie.name === "upm_client_session"
      );
    } else {
      sessionCookie = cookies.find(
        cookie => cookie.name === "upm_guest_session"
      );
    }
    console.log(sessionCookie);
    return sessionCookie;
  }
}
