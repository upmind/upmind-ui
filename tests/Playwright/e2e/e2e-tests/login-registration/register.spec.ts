import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import {
  Registration,
  STRONG_PASSWORD
} from "../../support/page-objects/templates/registration";

let registration: Registration;

// FE-2661 — every error string in the cross-product of {min_length} × {letter,
// number, symbol}. Mirrors the cart-side i18n keys in `auth_password.error.*`.
const PASSWORD_ERROR_CASES: Array<{
  name: string;
  input: string;
  message: string;
}> = [
  {
    name: "Single letter input",
    input: "a",
    message:
      "Password must be at least 8 characters, contain a number, and a symbol"
  },
  {
    name: "Letters only",
    input: "abcdefgh",
    message: "Password must contain a number and a symbol"
  },
  {
    name: "Digits only",
    input: "12345678",
    message: "Password must contain a letter and a symbol"
  },
  {
    name: "Symbols only",
    input: "!!!!!!!!",
    message: "Password must contain a letter and a number"
  },
  {
    name: "Letters + digits, no symbol",
    input: "abc12345",
    message: "Password must contain a symbol"
  },
  {
    name: "Letters + symbols, no digit",
    input: "abc!!!!!",
    message: "Password must contain a number"
  },
  {
    name: "Digits + symbols, no letter",
    input: "123!!!!!",
    message: "Password must contain a letter"
  },
  {
    name: "All rules met but too short",
    input: "a1!",
    message: "Password must be at least 8 characters"
  }
];

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

  test("Invalid email entry", async () => {
    await registration.firstName.fill(faker.person.firstName());
    await registration.lastName.fill(faker.person.lastName());
    await registration.email.fill(
      `nathan.robinson+${faker.string.alpha({ length: 10 })}`
    );
    await registration.password.fill(STRONG_PASSWORD);
    await expect(registration.getValidationError("username")).toContainText(
      "A username or email address is required"
    );
  });

  for (const { name, input, message } of PASSWORD_ERROR_CASES) {
    test(`Password validation — ${name}`, async () => {
      await registration.password.click();
      if (input.length) await registration.password.fill(input);
      await registration.password.blur();
      await expect(registration.passwordMessage).toHaveText(message);
    });
  }

  test("Password message clears when every rule is satisfied", async () => {
    await registration.password.fill("abc12345"); // missing symbol
    await registration.password.blur();
    await expect(registration.passwordMessage).toBeVisible();

    await registration.password.fill("abc123!@");
    await expect(registration.passwordMessage).toBeHidden();
  });

  test("Strength meter is hidden until the user types", async () => {
    await expect(registration.passwordStrengthBars).toHaveCount(0);
    await registration.password.fill("a");
    await expect(registration.passwordStrengthBars).toHaveCount(4);
  });

  test("Strength meter progresses through weak → medium → strong", async () => {
    await registration.password.fill("a"); // 1/4 → weak
    await expect(registration.passwordStrengthBars.nth(0)).toHaveClass(
      /bg-accent-danger/
    );
    await expect(registration.passwordStrengthBars.nth(1)).toHaveClass(
      /bg-skeleton/
    );

    await registration.password.fill("abc12345"); // 3/4 → medium
    await expect(registration.passwordStrengthBars.nth(0)).toHaveClass(
      /bg-accent-warning/
    );
    await expect(registration.passwordStrengthBars.nth(2)).toHaveClass(
      /bg-accent-warning/
    );
    await expect(registration.passwordStrengthBars.nth(3)).toHaveClass(
      /bg-skeleton/
    );

    await registration.password.fill("abc123!@"); // 4/4 → strong
    for (let i = 0; i < 4; i++) {
      await expect(registration.passwordStrengthBars.nth(i)).toHaveClass(
        /bg-accent-success/
      );
    }
  });

  test("Generator populates a password that satisfies every rule", async () => {
    await expect(registration.password).toHaveValue("");
    await registration.passwordGenerator.click();
    const generated = await registration.password.inputValue();
    expect(generated.length).toBeGreaterThanOrEqual(16);
    expect(generated).toMatch(/[a-zA-Z]/);
    expect(generated).toMatch(/\d/);
    expect(generated).toMatch(/[^a-zA-Z0-9]/);
    // Generated password unmasks so the user can read it.
    await expect(registration.password).toHaveAttribute("type", "text");
    await expect(registration.passwordMessage).toBeHidden();
  });

  test("Show/hide toggle flips between password and text", async () => {
    await registration.password.fill("Password1!");
    await expect(registration.password).toHaveAttribute("type", "password");
    await registration.passwordToggle.click();
    await expect(registration.password).toHaveAttribute("type", "text");
    await registration.passwordToggle.click();
    await expect(registration.password).toHaveAttribute("type", "password");
  });
});
