import { newUser, expect } from "../../../support/fixtures/auth-context";
import { fakerEN_GB } from "@faker-js/faker";
import { products } from "../../../support/constants/products";
import { goToCheckout } from "../../../support/flows/checkout";
import {
  addAddressViaHeadless,
  addBillingAddressViaHeadless,
  addCompanyViaHeadless,
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
  // Each test registers its OWN fresh client via the `newUser` fixture — there
  // is no shared staging account, so nothing races on shared server state. The
  // "existing address/company" these tests edit is seeded per-test through the
  // headless bridge (addBillingAddressViaHeadless / addCompanyViaHeadless).
  // Serial mode is retained only to keep concurrent headless seeds from
  // hammering the staging API.
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
      // The order PUT resolving does not guarantee the live-basket TanStack
      // cache has refetched the committed address_id — basket.isRefreshed() can
      // settle on the pre-PUT snapshot, so a single read can return the stale
      // (pre-add, null) id. Poll the headless read until it reflects the newly
      // committed address instead of reading once and racing the refetch.
      await expect
        .poll(() => getBasketAddressIdViaHeadless(page), { timeout: 15000 })
        .not.toBe(currentAddress);
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
      // Assert the edit reaches the wire (FE-2985 mutation-chain rule, same
      // debounce-race shape as FE-2784): the address PUT payload must carry the
      // new street, so a stale pre-edit model fails at the request rather than
      // silently passing the summary check.
      const addressRequest = page.waitForRequest(
        r =>
          ["PUT", "PATCH"].includes(r.method()) &&
          /\/clients\/[^/]+\/addresses\/[^/?]+/.test(r.url())
      );
      await checkout.clickSaveDetails();
      expect(JSON.stringify((await addressRequest).postDataJSON())).toContain(
        newAddress
      );
      // Saving an edited address returns to the address-selection list INSIDE
      // the same dialog-window (radio cards + Continue), so the whole dialog
      // stays open BY DESIGN — assert the edit FORM closed instead of the whole
      // dialog (the analogous sibling company-edit fix, commit 5e745f0dc).
      await expect(page.getByTestId("form-manage")).toBeHidden();
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
  // Edit-company mirrors edit-address: the company-seed race is fixed
  // (addCompanyViaHeadless drives the real useClientCompanyManager), the Edit
  // link now carries data-test-key="link-edit" (CompanyItem.vue), and saving an
  // edited company returns to the still-open business-details selection list and
  // needs an explicit Continue click to collapse — the same designed asymmetry
  // proven for edit vs add, asserted at the test layer below.
  newUser(
    "Edit existing company at checkout",
    async ({ page, checkout, clientId }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      // The client needs (1) a billing address committed to the order and (2) a
      // real company (with an id) to EDIT — otherwise link-edit opens an empty
      // create form and the save hits the POST branch, never the PUT/PATCH the
      // assertion below waits for.
      //
      // ONE address serves both: the company and the order billing share it.
      // Seeding the same street twice 422s as a duplicate address, so we create
      // it once and reuse its id. Seed the billing address FIRST, while the
      // client still has zero addresses — addBillingAddressViaHeadless drives
      // the address *manager*, whose SET is only valid on the schema's
      // full-`address` branch (the branch a client takes until a default address
      // exists; once one does the schema flips to require `addressId` and the
      // manager SET rejects with a reactive XState state that cannot cross the
      // page↔node bridge). Then reuse that id for the company: passing
      // `addressId` puts the company schema on its `addressId` branch (a default
      // address now exists), and the manager's add chain reuses that existing
      // address instead of re-creating it.
      const billingAddressId = await addBillingAddressViaHeadless(
        page,
        clientId,
        SEEDED_ADDRESS
      );
      await addCompanyViaHeadless(page, clientId, {
        name: fakerEN_GB.company.name(),
        addressId: billingAddressId ?? undefined
      });
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
      // Assert the edited company reaches the wire (FE-2985 mutation-chain
      // rule): the company update payload must carry the new name, so a stale
      // model fails at the request rather than passing the summary check below.
      const companyRequest = page.waitForRequest(
        r =>
          ["PUT", "PATCH"].includes(r.method()) &&
          /\/clients\/[^/]+\/companies\/[^/?]+/.test(r.url())
      );
      await checkout.clickSaveDetails("companies");
      expect(JSON.stringify((await companyRequest).postDataJSON())).toContain(
        newCompany
      );
      // Saving an edited company returns to the business-details selection list
      // INSIDE the same dialog-window (radio cards + Continue), so the whole
      // dialog stays open BY DESIGN — only ADD collapses straight back to the
      // billing summary; EDIT (company AND address alike) requires an explicit
      // Continue click to commit and collapse. Assert the edit FORM closed
      // instead of the whole dialog (mirrors the sibling address-edit flow).
      await expect(page.getByTestId("form-manage")).toBeHidden();
      // The company radio card carries no data-test-value (presence-only); the
      // edited name is carried in billing-summary-company's data-test-value.
      await expect(page.getByTestId("radio-card-item").first()).toBeVisible();
      await page.getByTestId("button-continue").click();
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
