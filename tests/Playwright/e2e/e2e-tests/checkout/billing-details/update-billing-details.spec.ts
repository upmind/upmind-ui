import { newUser, expect } from "../../../support/fixtures/auth-context";
import { fakerEN_GB } from "@faker-js/faker";
import {
  addAddressToClient,
  getCurrentAddressId
} from "../../../support/api/client";
import { products } from "../../../support/constants/products";
import { goToCheckout } from "../../../support/flows/checkout";

newUser.describe("New User - Billing Details at checkout", () => {
  newUser.describe.configure({ mode: "parallel" });
  newUser(
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
      await page.getByTestId("link-change").click();
      await checkout.selectAddressFromSearch(
        "10 Downing St, Westminster, London SW1A 2AA, UK",
        "10 Downing Street, Downing Street, London SW1A 2AA, UK"
      );
      await checkout.clickSaveDetails();
      await expect(checkout.billingDetails).toHaveText(
        /10 Downing Street.*London.*SW1A 2AA.*United Kingdom/s
      );
    }
  );
  // @quarantine(FE-2784, 2026-06-28)
  newUser.skip(
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
      let newCompany = fakerEN_GB.company.name();
      await companyNameInput.fill(newCompany);
      await page
        .getByTestId("form-item-company-reg-number")
        .locator("input")
        .fill(fakerEN_GB.string.numeric({ length: 9 }));
      await page
        .getByTestId("form-item-company-tax-number")
        .locator("input")
        .fill(fakerEN_GB.string.numeric({ length: 9 }));
      await checkout.selectAddressFromSearch(
        "10 Downing St, Westminster, London SW1A 2AA, UK",
        "10 Downing Street, Downing Street, London SW1A 2AA, UK"
      );
      await checkout.clickSaveDetails();
      await expect(checkout.billingDetails).toContainText(newCompany);
      await expect(checkout.billingDetails).toContainText(
        /10 Downing Street.*London.*SW1A 2AA.*United Kingdom/s
      );
    }
  );
});

/* "Existing user" tests cannot run in parallel due to shared state of Checkout User on the staging env. 
  To run in parallel, set up individual users for each test in your test env, and use the following test
  pattern, which can overwrite/replace the existing login details in the test.use at the top of this spec */

/*
  registeredUser("Test name goes here", async ({ page, checkout, loginAs }) => {
    const session = await loginAs(Logins.userA.username, Logins.userA.password);
    const token = session.access_token;
    ...
  });
  */

newUser.describe("Existing Address - Billing Details at checkout", () => {
  // All tests below log in as Logins.checkoutUser, which is also used in
  // login-registration/login.spec.ts. Serial mode prevents these tests from
  // racing against each other on the same staging account.
  newUser.describe.configure({ mode: "serial" });
  // @quarantine(FE-2784, 2026-06-28)
  newUser.skip(
    "Existing Address - add new address at checkout",
    async ({ page, context, checkout, token, clientId }) => {
      await addAddressToClient(token, clientId);
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
      await checkout.clickSaveDetails();
      await expect(checkout.addressCard).toHaveText(
        new RegExp(`${streetName}.*London.*SW1A 2AA.*United Kingdom`, "s")
      );
      let newAddress = await getCurrentAddressId(token);
      expect(newAddress).not.toBe(currentAddress);
    }
  );
  // @quarantine(FE-2784, 2026-06-28)
  newUser.skip(
    "Existing User add new company details at checkout",
    async ({ page, context, checkout, token, clientId }) => {
      await addAddressToClient(token, clientId);
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
      await checkout.clickSaveDetails("companies");
      await expect(checkout.billingDetails).toContainText(newCompany);
    }
  );
  // @quarantine(FE-2784, 2026-06-28)
  // Setup uses raw-HTTP addAddressToClient, bypassing the headless layer, so
  // TanStack never refetches — the edited address isn't reflected after save
  // (stale cache). Same cluster/root cause as the FE-2784 quarantines above.
  newUser.skip(
    "Edit existing address at checkout",
    async ({ page, context, checkout, token, clientId }) => {
      await addAddressToClient(token, clientId);
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
      await checkout.clickSaveDetails();
      await expect(checkout.dialogWindow).toBeHidden();
      await expect(page.getByTestId("radio-card-item").first()).toContainText(
        newAddress
      );
      await page.getByTestId("button-continue").click();
      await expect(checkout.billingDetails).toContainText(newAddress);
    }
  );
  // @quarantine(FE-2784, 2026-06-28)
  // Same raw-HTTP addAddressToClient cache-drift cluster as :161 — TanStack
  // doesn't refetch after the API-set address, so the edit isn't reflected.
  newUser.skip(
    "Edit existing company at checkout",
    async ({ page, context, checkout, token, clientId }) => {
      await addAddressToClient(token, clientId);
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
      await checkout.clickSaveDetails("companies");
      await expect(checkout.dialogWindow).toBeHidden();
      await expect(page.getByTestId("radio-card-item").first()).toContainText(
        newCompany
      );
      await page.getByTestId("button-continue").click();
      await expect(checkout.billingDetails).toContainText(newCompany);
    }
  );
});
