import { Page } from "@playwright/test";
import { URLs } from "../constants/urls";
import { Logins } from "../constants/logins";
import { faker } from "@faker-js/faker";
import { waitForSessionCookie } from "../helpers";

/**
 * Logs in as checkout test user via UI form fill.
 */
export async function inputLogin(page: Page) {
  const username = page.getByTestId(
    "form-field-your-username-or-email-address"
  );
  const password = page.getByTestId("form-field-password");

  await username.getByTestId("text-input").fill(Logins.checkoutUser.username);
  await password.getByTestId("text-input").fill(Logins.checkoutUser.password);
  await page.getByTestId("button-log-into-my-account").click();
}

/**
 * Registers a new user account via UI form fill and logs in.
 */
export async function inputRegistration(page: Page) {
  const firstName = page.getByTestId("form-field-first-name");
  const lastName = page.getByTestId("form-field-last-name");
  const email = page.getByTestId("form-field-your-email-address");
  const password = page.getByTestId("form-field-password");

  await firstName.getByTestId("text-input").fill(`${faker.person.firstName()}`);
  await lastName.getByTestId("text-input").fill(`${faker.person.lastName()}`);
  await email
    .getByTestId("text-input")
    .fill(`nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`);
  await password
    .getByTestId("text-input")
    .fill(`${faker.string.alphanumeric({ length: 10 })}`);
  await page.getByTestId("button-continue").click();
  await waitForSessionCookie(page.context());
}
