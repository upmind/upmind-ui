import { test, expect, BrowserContext } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import { Registration } from "../../support/page-objects/templates/registration";
let registration: Registration;

test.describe("User Registration", () => {
  test.beforeEach(async ({ page, context }) => {
    registration = new Registration(page, context);
    await page.goto(URLs.register);
  });
  test("Registering via /auth/register/", async ({ page }) => {
    await registration.inputRegistration();
    await page.waitForURL(URLs.emptyBasket, { timeout: 30000 });
    await expect(registration.getCookie("client")).toBeDefined();
  });
  test("Invalid password entry", async ({ page }) => {
    await registration.firstName.fill(`${faker.person.firstName()}`);
    await registration.lastName.fill(`${faker.person.lastName()}`);
    await registration.email.fill(
      `nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`
    );
    await registration.password.fill(
      `${faker.internet.password({ length: 10, pattern: /[A-Z]/ })}`
    );
    await page.getByTestId("button-continue").click();
    await expect(registration.alertTitle).toContainText(
      "We experienced an error while trying to create your account"
    );
  });
  test("Invalid email entry", async ({ page }) => {
    await registration.firstName.fill(`${faker.person.firstName()}`);
    await registration.lastName.fill(`${faker.person.lastName()}`);
    await registration.email.fill(
      `nathan.robinson+${faker.string.alpha({ length: 10 })}`
    );
    await registration.password.fill(
      `${faker.internet.password({ length: 10, pattern: /[A-Z]/, prefix: "123" })}`
    );
    await expect(page.getByTestId("form-item-message-username")).toContainText(
      "A username or email address is required"
    );
  });
});
