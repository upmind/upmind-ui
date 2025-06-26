import { Page, Locator } from "@playwright/test";
export class Login {
  readonly page: Page;
  readonly usernameField: Locator;
  readonly passwordField: Locator;
  readonly loginButton: Locator;
  readonly popoverTrigger: Locator;
  readonly popoverContent: Locator;
  readonly alert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameField = page.getByTestId(
      "form-field-your-username-or-email-address"
    );
    this.passwordField = page.getByTestId("form-field-password");
    this.loginButton = page.getByTestId("button-log-into-my-account");
    this.popoverTrigger = page.getByTestId("popover-trigger");
    this.popoverContent = page.getByTestId("popover-content");
    this.alert = page.getByRole("alert");
  }

  async inputLogin(username: string, password: string) {
    await this.usernameField.getByTestId("text-input").fill(username);
    await this.passwordField.getByTestId("text-input").fill(password);
    await this.loginButton.click();
  }

  async loginFromPopover(username: string, password: string) {
    await this.popoverTrigger.click();
    await this.popoverContent
      .locator(this.usernameField.getByTestId("text-input"))
      .fill(username);
    await this.popoverContent
      .locator(this.passwordField.getByTestId("text-input"))
      .fill(password);
    await this.popoverContent.locator(this.loginButton).click();
  }
}
