import { Page } from "@playwright/test";
import { URLs } from "../../constants/Urls";
import { faker } from "@faker-js/faker";

/* Logs in as checkout test user */
export async function inputLogin(page: Page) {
  const username = page.getByTestId(
    "form-field-your-username-or-email-address"
  );
  const password = page.getByTestId("form-field-password");

  await username
    .getByTestId("text-input")
    .fill("nathan.robinson+checkouttest@upmind.com");
  await password.getByTestId("text-input").fill("bnd0ATW-udt3bxr0zmw");
  await page.getByTestId("button-log-into-my-account").click();
}

/* Registers a new user account and logs in */
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
  await page.waitForLoadState("networkidle");
}
