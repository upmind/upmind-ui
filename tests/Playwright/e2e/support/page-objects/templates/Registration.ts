import { Page, Locator, BrowserContext } from "@playwright/test";
import { faker } from "@faker-js/faker";

export class Registration {
  readonly page: Page;
  readonly registrationForm: Locator;
  readonly context: BrowserContext;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly alert: Locator;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.registrationForm = page.getByTestId("registration-form");
    this.context = context;
    this.firstName = page.getByTestId("input-properties-firstname");
    this.lastName = page.getByTestId("input-properties-lastname");
    this.email = page.getByTestId("input-properties-username");
    this.password = page.getByTestId("input-password");
    this.alert = page.getByRole("alert");
  }

  async inputRegistration() {
    await this.firstName.fill(`${faker.person.firstName()}`);
    await this.lastName.fill(`${faker.person.lastName()}`);
    await this.email.fill(
      `nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`
    );
    await this.password.fill(
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
