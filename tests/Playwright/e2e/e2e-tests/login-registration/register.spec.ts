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
  test("Invalid password entry (Too short & no number)", async ({ page }) => {
    await registration.firstName.fill(`${faker.person.firstName()}`);
    await registration.lastName.fill(`${faker.person.lastName()}`);
    await registration.email.fill(
      `nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`
    );
    await registration.password.fill("one");
    await expect(registration.getValidationError("password")).toContainText(
      "Password must be at least 8 characters and contain a number"
    );
  });
  test("Invalid password entry (Too short & no letter)", async ({ page }) => {
    await registration.firstName.fill(`${faker.person.firstName()}`);
    await registration.lastName.fill(`${faker.person.lastName()}`);
    await registration.email.fill(
      `nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`
    );
    await registration.password.fill("123456");
    await expect(registration.getValidationError("password")).toContainText(
      "Password must be at least 8 characters and contain a lowercase letter"
    );
  });
  test("Invalid password entry (Too short)", async ({ page }) => {
    await registration.firstName.fill(`${faker.person.firstName()}`);
    await registration.lastName.fill(`${faker.person.lastName()}`);
    await registration.email.fill(
      `nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`
    );
    await registration.password.fill("a123456");
    await expect(registration.getValidationError("password")).toContainText(
      "Password must be at least 8 characters"
    );
  });
  test("Invalid password entry (No number)", async ({ page }) => {
    await registration.firstName.fill(`${faker.person.firstName()}`);
    await registration.lastName.fill(`${faker.person.lastName()}`);
    await registration.email.fill(
      `nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`
    );
    await registration.password.fill("abcdefgh");
    await expect(registration.getValidationError("password")).toContainText(
      "Password must contain a number"
    );
  });
  test("Invalid password entry (No letter)", async ({ page }) => {
    await registration.firstName.fill(`${faker.person.firstName()}`);
    await registration.lastName.fill(`${faker.person.lastName()}`);
    await registration.email.fill(
      `nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`
    );
    await registration.password.fill("12345678");
    await expect(registration.getValidationError("password")).toContainText(
      "Password must contain a lowercase letter"
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
    await expect(registration.getValidationError("username")).toContainText(
      "A username or email address is required"
    );
  });
});
