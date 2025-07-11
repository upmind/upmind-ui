import { Page, Locator, BrowserContext } from "@playwright/test";
import { faker } from "@faker-js/faker";

export class Registration {
  readonly page: Page;
  readonly context: BrowserContext;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly alert: Locator;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.firstName = page.getByTestId("form-field-first-name");
    this.lastName = page.getByTestId("form-field-last-name");
    this.email = page.getByTestId("form-field-your-email-address");
    this.password = page.getByTestId("form-field-password");
    this.alert = page.getByRole("alert");
  }

  async inputRegistration() {
    await this.firstName
      .getByTestId("text-input")
      .fill(`${faker.person.firstName()}`);
    await this.lastName
      .getByTestId("text-input")
      .fill(`${faker.person.lastName()}`);
    await this.email
      .getByTestId("text-input")
      .fill(`nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`);
    await this.password
      .getByTestId("text-input")
      .fill(
        `${faker.internet.password({ length: 10, pattern: /[A-Z]/, prefix: "123" })}`
      );
    await this.page.getByTestId("button-continue").click();
  }

  async getCookie(tokenType: string) {
    const cookies = await this.context.cookies();
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
