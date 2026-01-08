import { expect, test } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import { Registration } from "../../../support/page-objects/templates/Registration";
import { Login } from "../../../support/page-objects/templates/Login";
import {
  createOrder,
  addProductToOrder
} from "../../../support/utils/functions/basket";
import { URLs } from "../../../support/constants/urls";
import {
  getSessionToken,
  getClientToken
} from "../../../support/utils/functions/tokens";
import { Logins } from "../../../support/constants/logins";
import { products } from "../../../support/constants/products";
let checkout: Checkout;
let token: string;
let register: Registration;
let login: Login;
let orderId: string | null;

test.describe("Billing Details at checkout", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    login = new Login(page);
    register = new Registration(page, context);
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    token = await getSessionToken(context);
    orderId = await createOrder(token);
    await addProductToOrder(
      `${token}`,
      `${orderId}`,
      products.DOMAIN_REGISTRATION,
      1,
      24,
      [],
      [],
      {
        domain: `${fakerEN_GB.string.alphanumeric({
          length: { min: 3, max: 15 }
        })}.com`
      },
      []
    );
    await page.goto(URLs.basket);
    await expect(page.getByTestId("basket-product")).toBeVisible();
  });
  test.describe("Add new billing details at checkout", () => {
    test("New User add new address at checkout via address search", async ({
      page
    }) => {
      await page.goto(URLs.checkout);
      await expect(register.registrationForm).toBeVisible();
      await register.inputRegistration();
      await checkout.addressSearch.fill(
        "10 Downing St, Westminster, London SW1A 2AA, UK"
      );
      const dropdown = page.locator('[role="dialog"][data-state="open"]');
      await dropdown
        .locator("li", {
          hasText: "10 Downing Street, Downing Street, London SW1A 2AA, UK"
        })
        .click();

      // Wait for the form to populate before saving
      await expect(checkout.addressLine1).toHaveValue("10 Downing Street");

      await Promise.all([
        page.waitForResponse(
          r =>
            r.url().includes("/addresses") &&
            r.status() >= 200 &&
            r.status() < 300
        ),
        checkout.saveDetails.click()
      ]);
      await expect(checkout.dialogWindow).toBeHidden();

      // Address card should now appear after form closes
      await expect(checkout.addressCard).toContainText("10 Downing Street", {
        timeout: 15000
      });
      await expect(checkout.addressCard).toContainText(
        "London, SW1A 2AA, Greater London, United Kingdom"
      );
    });
    test("New User add new company details at checkout", async ({ page }) => {
      await page.goto(URLs.checkout);
      await expect(register.registrationForm).toBeVisible();
      await register.inputRegistration();
      await page.getByText("Business details").click();
      const companyNameInput = page
        .getByTestId("form-item-company-name")
        .locator("input");
      await companyNameInput.waitFor({ state: "visible" });
      await companyNameInput.pressSequentially("Acme Corp");
      await page
        .getByTestId("form-item-company-reg-number")
        .locator("input")
        .pressSequentially("12345678");
      await page
        .getByTestId("form-item-company-tax-number")
        .locator("input")
        .pressSequentially("12345678");
      await checkout.addressSearch.fill(
        "10 Downing St, Westminster, London SW1A 2AA, UK"
      );
      const dropdown = page.locator('[role="dialog"][data-state="open"]');
      await dropdown
        .locator("li", {
          hasText: "10 Downing Street, Downing Street, London SW1A 2AA, UK"
        })
        .click();
      await Promise.all([
        page.waitForResponse(
          r => r.url().includes("/billing-details") && r.status() === 200
        ),
        checkout.saveDetails.click()
      ]);
      await expect(checkout.dialogWindow).toBeHidden();
      await expect(checkout.billingDetails).toContainText("Acme Corp");
      await expect(checkout.billingDetails).toContainText("12345678");
    });
    test("Existing User add new address at checkout", async ({ page }) => {
      await getClientToken(
        page,
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await page.goto(URLs.checkout);
      await expect(checkout.billingDetails).toBeVisible();
      await page.getByText("Personal details").click();
      await checkout.page.getByTestId("link-change").click();
      await checkout.page.getByTestId("link-add-new").click();
      await checkout.addressSearch.fill(
        "10 Downing St, Westminster, London SW1A 2AA, UK"
      );
      const dropdown = page.locator('[role="dialog"][data-state="open"]');
      await dropdown
        .locator("li", {
          hasText: "10 Downing Street, Downing Street, London SW1A 2AA, UK"
        })
        .click();
      await Promise.all([
        page.waitForResponse(
          r => r.url().includes("/addresses") && r.status() === 200
        ),
        checkout.saveDetails.click()
      ]);
      await expect(checkout.dialogWindow).toBeHidden();
      await expect(checkout.addressCard).toContainText("10 Downing Street");
      await expect(checkout.addressCard).toContainText(
        "London, SW1A 2AA, Greater London, United Kingdom"
      );
    });
    test("Existing User add new company details at checkout", async ({
      page
    }) => {
      await getClientToken(
        page,
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await page.goto(URLs.checkout);
      await expect(checkout.billingDetails).toBeVisible();
      await page.getByText("Business details").click();
      await page.getByTestId("link-change").click();
      await page.getByTestId("link-add-new").click();
      const companyNameInput = page.getByTestId("input-properties-name");
      await companyNameInput.waitFor({ state: "visible" });
      await companyNameInput.pressSequentially("Acme Corp");
      await page
        .getByTestId("input-properties-reg-number")
        .pressSequentially("12345678");
      await page
        .getByTestId("input-properties-tax-properties-number")
        .pressSequentially("12345678");
      await Promise.all([
        page.waitForResponse(
          r => r.url().includes("/billing-details") && r.status() === 200
        ),
        checkout.saveDetails.click()
      ]);
      await expect(checkout.dialogWindow).toBeHidden();
      await expect(checkout.billingDetails).toContainText("Acme Corp");
      await expect(checkout.billingDetails).toContainText("12345678");
    });
  });
  test.describe("Edit billing details at checkout", async () => {
    test("Edit existing address at checkout", async ({ page }) => {
      let newAddress = fakerEN_GB.location.streetAddress();
      await getClientToken(
        page,
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await page.goto(URLs.checkout);
      await page.getByText("Personal details").click();
      await expect(checkout.billingDetails).toBeVisible();
      await page.getByTestId("link-change").click();
      await page.getByTestId("link-edit").first().click();
      await page.getByTestId("input-properties-address-1").clear();
      await page
        .getByTestId("input-properties-address-1")
        .pressSequentially(newAddress);
      await Promise.all([
        page.waitForResponse(
          r => r.url().includes("/addresses") && r.status() === 200
        ),
        checkout.saveDetails.click()
      ]);
      await expect(checkout.dialogWindow).toBeHidden();
    });
    test("Edit existing company at checkout", async ({ page }) => {
      let newCompany = fakerEN_GB.company.name();
      await getClientToken(
        page,
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await page.goto(URLs.checkout);
      await page.getByText("Business details").click();
      await expect(checkout.billingDetails).toBeVisible();
      await page.getByTestId("link-change").click();
      await page.getByTestId("link-edit").first().click();
      await page.getByTestId("input-properties-name").clear();
      await page
        .getByTestId("input-properties-name")
        .pressSequentially(newCompany);
      await Promise.all([
        page.waitForResponse(
          r => r.url().includes("/billing-details") && r.status() === 200
        ),
        checkout.saveDetails.click()
      ]);
      await expect(checkout.dialogWindow).toBeHidden();
      await expect(page.getByTestId("radio-card-change").first()).toContainText(
        newCompany
      );
    });
  });
});
