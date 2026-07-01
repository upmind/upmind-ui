import { Page, Locator, BrowserContext } from "@playwright/test";
export class Login {
  readonly page: Page;
  readonly context?: BrowserContext;
  readonly loginForm: Locator;
  readonly usernameField: Locator;
  readonly passwordField: Locator;
  readonly loginButton: Locator;
  readonly twoFactorInput: Locator;
  readonly popoverTrigger: Locator;
  readonly popoverContent: Locator;
  readonly alert: Locator;

  constructor(page: Page, context?: BrowserContext) {
    this.page = page;
    this.context = context;
    this.loginForm = page.getByTestId("login-form");
    this.usernameField = page
      .getByTestId("form-item-username")
      .getByRole("textbox");
    this.passwordField = page
      .getByTestId("form-item-password")
      .getByRole("textbox");
    // Locale-stable locator: the button testid is derived from the translated
    // label (button-${kebabCase(label)}), so getByTestId("button-log-in-to-
    // your-account") only matches in English and times out in other locales.
    // The submit type is locale-independent and re-scopes correctly into the
    // popover login flow below.
    this.loginButton = page.locator('button[type="submit"]');
    this.twoFactorInput = page.getByTestId("input-otp-slot");
    this.popoverTrigger = page.getByTestId("login-popover-trigger");
    this.popoverContent = page.getByTestId("popover-content");
    this.alert = page.getByTestId("auth-alert");
  }

  async inputLogin(username: string, password: string) {
    await this.usernameField.fill(username);
    await this.passwordField.fill(password);
    await this.loginButton.click();
  }

  async loginFromPopover(username: string, password: string) {
    await this.popoverTrigger.click();
    await this.popoverContent.locator(this.usernameField).fill(username);
    await this.popoverContent.locator(this.passwordField).fill(password);
    await this.popoverContent.locator(this.loginButton).click();
  }
}
