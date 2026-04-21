import {
  newUserSession,
  existingUserSession,
  expect
} from "../../../support/fixtures/auth-context";
import { faker, fakerEN_GB } from "@faker-js/faker";
import { getCurrentAddressId } from "../../../support/api/client";
import { URLs } from "../../../support/constants/urls";
import { Logins } from "../../../support/constants/logins";
import { products } from "../../../support/constants/products";
import { goToCheckout } from "../../../support/flows/checkout";

existingUserSession.use({
  userLogin: Logins.checkoutUser.username,
  userPassword: Logins.checkoutUser.password
});

newUserSession.describe("New User - Billing Details at checkout", () => {
  newUserSession(
    "New User add new address at checkout via address search",
    async ({ page, context, checkout }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      await checkout.addNewAddress.click();
      await expect(checkout.billingDetails).toBeVisible();
      await checkout.addressSearch.fill(
        "10 Downing St, Westminster, London SW1A 2AA, UK"
      );
      const dropdown = page.locator('[role="dialog"][data-state="open"]');
      await dropdown
        .locator("li", {
          hasText: "10 Downing Street, Downing Street, London SW1A 2AA, UK"
        })
        .click();
      await page.waitForTimeout(1000);
      await checkout.saveDetails.click();
      await expect(checkout.billingDetails).toHaveText(
        /10 Downing Street.*London.*SW1A 2AA.*United Kingdom/s
      );
    }
  );
  newUserSession(
    "New User add new company details at checkout",
    async ({ page, context, checkout }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      await checkout.addNewAddress.click();
      await expect(checkout.billingCards).toBeVisible();
      await page.getByText("Business Details").click();
      await expect(page.getByTestId("form")).toBeVisible();
      const companyNameInput = page
        .getByTestId("form-item-company-name")
        .locator("input");
      await companyNameInput.waitFor({ state: "visible" });
      await companyNameInput.fill("Acme Corp");
      await page
        .getByTestId("form-item-company-reg-number")
        .locator("input")
        .fill("12345678");
      await page
        .getByTestId("form-item-company-tax-number")
        .locator("input")
        .fill("12345678");
      await checkout.addressSearch.fill(
        "10 Downing St, Westminster, London SW1A 2AA, UK"
      );
      const dropdown = page.locator('[role="dialog"][data-state="open"]');
      await dropdown
        .locator("li", {
          hasText: "10 Downing Street, Downing Street, London SW1A 2AA, UK"
        })
        .click();
      await page.waitForTimeout(1000);
      await checkout.saveDetails.click();
      await checkout.saveDetails.click();
      await checkout.saveDetails.click();
      await expect(checkout.billingDetails).toContainText("Acme Corp");
      await expect(checkout.billingDetails).toContainText("12345678");
    }
  );
});

/* "Existing user" tests cannot run in parallel due to shared state of Checkout User on the staging env. 
  To run in parallel, set up individual users for each test in your test env, and use the following test
  pattern, which can overwrite/replace the existing login details in the test.use at the top of this spec */

/*
  existingUserSession("Test name goes here", async ({ page, checkout, loginAs }) => {
    const session = await loginAs(Logins.userA.username, Logins.userA.password);
    const token = session.access_token;
    ...
  });
  */

existingUserSession.describe(
  "Existing User - Billing Details at checkout",
  () => {
    existingUserSession(
      "Existing User add new address at checkout",
      async ({ page, context, checkout, token }) => {
        await goToCheckout(
          page,
          context,
          products.STARTER_HOSTING,
          null,
          null,
          false
        );
        await expect(checkout.billingDetails).toBeVisible();
        await page.getByTestId("link-change").click();
        await expect(checkout.billingCards).toBeVisible();
        await page.getByText("Personal Details").click();
        let currentAddress = await getCurrentAddressId(token);
        await page.getByTestId("link-add-new").click();
        let streetName = fakerEN_GB.location.streetAddress();
        await checkout.manuallyInputAddress(
          streetName,
          "London",
          "SW1A 2AA",
          null
        );
        await checkout.saveDetails.click();
        await checkout.saveDetails.click();
        await checkout.saveDetails.click();
        await expect(checkout.addressCard).toHaveText(
          new RegExp(`${streetName}.*London.*SW1A 2AA.*United Kingdom`, "s")
        );
        await page.waitForTimeout(5000);
        let newAddress = await getCurrentAddressId(token);
        expect(newAddress).not.toBe(currentAddress);
      }
    );
    existingUserSession(
      "Existing User add new company details at checkout",
      async ({ page, context, checkout }) => {
        await goToCheckout(
          page,
          context,
          products.STARTER_HOSTING,
          null,
          null,
          false
        );
        await expect(checkout.billingDetails).toBeVisible();
        await page.getByTestId("link-change").click();
        await expect(checkout.billingCards).toBeVisible();
        await page.getByTestId("tab-business-details").click();
        await page.getByTestId("link-add-new").click();
        const companyNameInput = page.getByTestId("input-properties-name");
        await companyNameInput.waitFor({ state: "visible" });
        let newCompany = fakerEN_GB.company.name();
        await companyNameInput.fill(newCompany);
        let regNumber = fakerEN_GB.string.numeric({ length: 9 });
        await page.getByTestId("input-properties-reg-number").fill(regNumber);
        await page
          .getByTestId("input-properties-tax-properties-number")
          .fill(regNumber);
        await page.waitForTimeout(1000);
        await checkout.saveDetails.click();
        await expect(checkout.billingDetails).toContainText(newCompany);
      }
    );
    existingUserSession(
      "Edit existing address at checkout",
      async ({ page, context, checkout }) => {
        await goToCheckout(
          page,
          context,
          products.STARTER_HOSTING,
          null,
          null,
          false
        );
        let newAddress = fakerEN_GB.location.streetAddress();
        await expect(checkout.billingDetails).toBeVisible();
        await page.getByTestId("link-change").click();
        await page.getByTestId("tab-personal-details").click();
        await page.getByTestId("link-edit").first().click();
        await page.getByTestId("input-properties-address-1").clear();
        await page.getByTestId("input-properties-address-1").fill(newAddress);
        await page.waitForTimeout(1000);
        await checkout.saveDetails.click();
        await expect(checkout.dialogWindow).toBeHidden();
        await expect(page.getByTestId("radio-card-item").first()).toContainText(
          newAddress
        );
        await page.getByTestId("button-continue").click();
        await expect(checkout.billingDetails).toContainText(newAddress);
      }
    );
    existingUserSession(
      "Edit existing company at checkout",
      async ({ page, context, checkout }) => {
        await goToCheckout(
          page,
          context,
          products.STARTER_HOSTING,
          null,
          null,
          false
        );
        await page.getByTestId("link-change").click();
        await expect(checkout.billingCards).toBeVisible();
        await page.getByTestId("tab-business-details").click();
        await page.getByTestId("link-edit").first().click();
        await page.getByTestId("input-properties-name").clear();
        let newCompany = fakerEN_GB.company.name();
        await page.getByTestId("input-properties-name").fill(newCompany);
        await page.waitForTimeout(1000);
        await checkout.saveDetails.click();
        await expect(checkout.dialogWindow).toBeHidden();
        await expect(page.getByTestId("radio-card-item").first()).toContainText(
          newCompany
        );
        await page.getByTestId("button-continue").click();
        await expect(checkout.billingDetails).toContainText(newCompany);
      }
    );
  }
);
