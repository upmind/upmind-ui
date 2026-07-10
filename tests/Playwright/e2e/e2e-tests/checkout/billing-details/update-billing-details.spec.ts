import { newUser, expect } from "../../../support/fixtures/auth-context";
import { fakerEN_GB } from "@faker-js/faker";
import { products } from "../../../support/constants/products";
import { goToCheckout } from "../../../support/flows/checkout";
import {
  addAddressViaHeadless,
  addBillingAddressViaHeadless,
  getBasketAddressIdViaHeadless
} from "../../../support/flows";
import { waitForBillingUpdate } from "../../../support/helpers/checkout";
import type { AddressModel } from "@upmind-automation/headless";

// NB: no `name` — a `name` on the model triggers the Google address-search
// path, which asynchronously re-derives the address and clobbers these fields.
const SEEDED_ADDRESS: AddressModel = {
  address: {
    address1: "10 Downing Street",
    address2: "",
    city: "London",
    postcode: "SW1A 2AB",
    countryId: "320e4357-95e7-8d18-484f-31643202d986",
    regionId: "de78642d-e539-7146-295f-21208469530d"
  }
};

newUser.describe("New User - Billing Details at checkout", () => {
  newUser.describe.configure({ mode: "parallel" });
  newUser(
    "New User add new address at checkout via address search",
    async ({ page, checkout }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await checkout.addNewAddress.click();
      await expect(checkout.billingDetails).toBeVisible();
      await page.getByTestId("link-change").click();
      await checkout.selectAddressFromSearch(
        "10 Downing St, Westminster, London SW1A 2AA, UK",
        "10 Downing Street, Downing Street, London SW1A 2AA, UK"
      );
      await checkout.clickSaveDetails();
      // The selected address line 1 is carried in billing-summary-address's
      // data-test-value (the address title).
      await expect(checkout.billingSummaryAddress).toBeVisible();
      await expect(checkout.billingSummaryAddress).toHaveAttribute(
        "data-test-value",
        "10 Downing Street"
      );
    }
  );
  newUser(
    "New User add new company details at checkout",
    async ({ page, checkout }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await checkout.addNewAddress.click();
      await expect(checkout.billingCards).toBeVisible();
      await page.getByTestId("tab-business-details").click();
      await expect(page.getByTestId("form-manage")).toBeVisible({
        timeout: 15000
      });
      const companyNameInput = page
        .getByTestId("form-item")
        .and(page.locator(`[data-test-value="company-name"]`))
        .locator("input");
      await companyNameInput.waitFor({ state: "visible" });
      let newCompany = fakerEN_GB.company.name();
      await companyNameInput.fill(newCompany);
      await page
        .getByTestId("form-item")
        .and(page.locator(`[data-test-value="company-reg-number"]`))
        .locator("input")
        .fill(fakerEN_GB.string.numeric({ length: 9 }));
      await page
        .getByTestId("form-item")
        .and(page.locator(`[data-test-value="company-tax-number"]`))
        .locator("input")
        .fill(fakerEN_GB.string.numeric({ length: 9 }));
      await checkout.selectAddressFromSearch(
        "10 Downing St, Westminster, London SW1A 2AA, UK",
        "10 Downing Street, Downing Street, London SW1A 2AA, UK"
      );
      await checkout.clickSaveDetails();
      // The entered company name and selected address line 1 are carried in
      // billing-summary-company / billing-summary-address data-test-value.
      await expect(checkout.billingSummaryCompany).toBeVisible();
      await expect(checkout.billingSummaryCompany).toHaveAttribute(
        "data-test-value",
        newCompany
      );
      await expect(checkout.billingSummaryAddress).toBeVisible();
      await expect(checkout.billingSummaryAddress).toHaveAttribute(
        "data-test-value",
        "10 Downing Street"
      );
    }
  );
});

/* "Existing user" tests cannot run in parallel due to shared state of Checkout User on the staging env.
  To run in parallel, set up individual users for each test in your test env, and use the following test
  pattern, which can overwrite/replace the existing login details in the test.use at the top of this spec */

/*
  registeredUser("Test name goes here", async ({ page, checkout, loginAs }) => {
    await loginAs(Logins.userA.username, Logins.userA.password);
    // Read server state via the headless bridge (getBasketViaHeadless /
    // getBasketAddressIdViaHeadless) — never a scraped token or raw API call.
    ...
  });
  */

newUser.describe("Existing Address - Billing Details at checkout", () => {
  // All tests below log in as Logins.checkoutUser, which is also used in
  // login-registration/login.spec.ts. Serial mode prevents these tests from
  // racing against each other on the same staging account.
  newUser.describe.configure({ mode: "serial" });
  newUser(
    "Existing Address - add new address at checkout",
    async ({ page, checkout, clientId }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await addAddressViaHeadless(page, clientId, SEEDED_ADDRESS);
      await expect(checkout.billingDetails).toBeVisible();
      await page.getByTestId("link-change").click();
      await expect(checkout.billingCards).toBeVisible();
      await page.getByTestId("tab-personal-details").click();
      let currentAddress = await getBasketAddressIdViaHeadless(page);
      await page.getByTestId("link-add-new").click();
      let streetName = fakerEN_GB.location.streetAddress();
      await checkout.manuallyInputAddress(
        streetName,
        "London",
        "SW1A 2AA",
        null
      );
      const billingUpdate = waitForBillingUpdate(page);
      await checkout.clickSaveDetails();
      // The address radio-card group carries no data-test-value (it is the
      // selection card, not the billing summary), so the saved street stays
      // presence-only here; the behaviour check is that the API address id
      // changed below.
      await expect(checkout.addressCard).toBeVisible();
      // Creating the address (POST /addresses) is separate from committing it to
      // the order (PUT /orders/{id}), which fires afterwards. Wait for that order
      // PUT before reading the current address id, otherwise it is read stale.
      await billingUpdate;
      let newAddress = await getBasketAddressIdViaHeadless(page);
      expect(newAddress).not.toBe(currentAddress);
    }
  );
  newUser(
    "Existing User add new company details at checkout",
    async ({ page, checkout, clientId }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await addAddressViaHeadless(page, clientId, SEEDED_ADDRESS);
      await expect(checkout.billingDetails).toBeVisible();
      await page.getByTestId("link-change").click();
      await expect(checkout.billingCards).toBeVisible();
      await page.getByTestId("tab-business-details").click();
      await expect(page.getByTestId("form-manage")).toBeVisible({
        timeout: 15000
      });
      // Existing user already has an address on file, so the company form
      // defaults its address to it (visible as "…— Default"). We are adding
      // COMPANY details only — enter the company name; do NOT add a new address
      // (clicking link-add-new opens the new-address drawer, which then requires
      // a fresh address and blocks the save).
      const companyNameInput = page
        .getByTestId("form-item")
        .and(page.locator(`[data-test-value="company-name"]`))
        .locator("input");
      await companyNameInput.waitFor({ state: "visible" });
      let newCompany = fakerEN_GB.company.name();
      await companyNameInput.fill(newCompany);
      let regNumber = fakerEN_GB.string.numeric({ length: 9 });
      await page
        .getByTestId("form-item")
        .and(page.locator(`[data-test-value="company-reg-number"]`))
        .locator("input")
        .fill(regNumber);
      await page
        .getByTestId("form-item")
        .and(page.locator(`[data-test-value="company-tax-number"]`))
        .locator("input")
        .fill(regNumber);
      // Assert the company reaches the wire (mutation-chain rule): the POST
      // /companies payload must carry the entered name, not just the summary.
      const companyRequest = page.waitForRequest(
        r =>
          r.method() === "POST" && /\/clients\/[^/]+\/companies/.test(r.url())
      );
      await checkout.clickSaveDetails("companies");
      const req = await companyRequest;
      expect(JSON.stringify(req.postDataJSON())).toContain(newCompany);
      // The entered company name is carried in billing-summary-company's
      // data-test-value.
      await expect(checkout.billingSummaryCompany).toBeVisible();
      await expect(checkout.billingSummaryCompany).toHaveAttribute(
        "data-test-value",
        newCompany
      );
    }
  );
  newUser(
    "Edit existing address at checkout",
    async ({ page, checkout, clientId }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await addBillingAddressViaHeadless(page, clientId, SEEDED_ADDRESS);
      let newAddress = fakerEN_GB.location.streetAddress();
      await expect(checkout.billingDetails).toBeVisible();
      await page.getByTestId("link-change").click();
      await page.getByTestId("tab-personal-details").click();
      await page.getByTestId("link-edit").first().click();
      await expect(page.getByTestId("form-manage")).toBeVisible({
        timeout: 15000
      });
      await page
        .getByTestId("input")
        .and(page.locator(`[data-test-value="properties-address-1"]`))
        .clear();
      await page
        .getByTestId("input")
        .and(page.locator(`[data-test-value="properties-address-1"]`))
        .fill(newAddress);
      await checkout.clickSaveDetails();
      await expect(checkout.dialogWindow).toBeHidden();
      // The address radio card carries no data-test-value (presence-only); the
      // edited street is carried in billing-summary-address's data-test-value.
      await expect(page.getByTestId("radio-card-item").first()).toBeVisible();
      await page.getByTestId("button-continue").click();
      await expect(checkout.billingSummaryAddress).toBeVisible();
      await expect(checkout.billingSummaryAddress).toHaveAttribute(
        "data-test-value",
        newAddress
      );
    }
  );
  newUser(
    "Edit existing company at checkout",
    async ({ page, checkout, clientId }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await addBillingAddressViaHeadless(page, clientId, SEEDED_ADDRESS);
      await page.getByTestId("link-change").click();
      await expect(checkout.billingCards).toBeVisible();
      await page.getByTestId("tab-business-details").click();
      await page.getByTestId("link-edit").first().click();
      await expect(page.getByTestId("form-manage")).toBeVisible({
        timeout: 15000
      });
      await page
        .getByTestId("input")
        .and(page.locator(`[data-test-value="properties-name"]`))
        .clear();
      let newCompany = fakerEN_GB.company.name();
      await page
        .getByTestId("input")
        .and(page.locator(`[data-test-value="properties-name"]`))
        .fill(newCompany);
      await checkout.clickSaveDetails("companies");
      await expect(checkout.dialogWindow).toBeHidden();
      // Saving the edited company commits it to the basket billing and the app
      // returns to the checkout summary BY ITSELF — clicking Continue here
      // raced that navigation (screenshot showed the summary already updated
      // while the test hunted for the button). Assert the user-visible
      // outcome directly: the summary carries the edited name.
      await expect(checkout.billingSummaryCompany).toBeVisible({
        timeout: 15000
      });
      await expect(checkout.billingSummaryCompany).toHaveAttribute(
        "data-test-value",
        newCompany
      );
    }
  );
});
