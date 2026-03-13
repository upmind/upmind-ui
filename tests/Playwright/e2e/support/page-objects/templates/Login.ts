import { Page, Locator } from "@playwright/test";
export class Login {
  readonly page: Page;
  readonly loginForm: Locator;
  readonly usernameField: Locator;
  readonly passwordField: Locator;
  readonly loginButton: Locator;
  readonly twoFactorInput: Locator;
  readonly popoverTrigger: Locator;
  readonly popoverContent: Locator;
  readonly alert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginForm = page.getByTestId("section-log-in");
    this.usernameField = page
      .getByTestId("form-item-username")
      .getByRole("textbox");
    this.passwordField = page
      .getByTestId("form-item-password")
      .getByRole("textbox");
    this.loginButton = page.getByTestId("button-log-in-to-your-account");
    this.twoFactorInput = page
      .getByTestId("form-item-token")
      .getByRole("textbox");
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
