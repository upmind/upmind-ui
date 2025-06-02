import { test, expect } from "@playwright/test";
import { URLs } from "../../../../../support/constants/urls";
import { Checkout } from "../../../../../support/page-objects/templates/Checkout";
import { coukDomain } from "../../../../../support/constants/checkout/test-cases/webcentral/domains/Co.uk";
let checkout: Checkout;
let testCases = coukDomain;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
  await page.goto(URLs.coukDomain);
  await checkout.optionsContainer.waitFor();
});

test.describe("Product Config - Happy Paths - Domain (.co.uk)", async () => {
  for (const {
    name,
    radioSelection = [],
    checkboxSelection = [],
    sldValue,
    registrantName,
    registrantOrg,
    registrantEmail,
    registrantPhone,
    registrantAddr1,
    registrantCity,
    registrantState,
    registrantPostcode,
    registrantCountry,
    total,
    billingCycle,
    tldValue,
  } of testCases) {
    test(name, async ({ page }) => {
      /* PRODUCT OPTIONS */
      /* Make product selections */
      for (const [radioGroupIndex, radioOptionIndex] of radioSelection) {
        await checkout.radioButtons.clickRadioButton(
          radioGroupIndex,
          radioOptionIndex
        );
      }
      for (const [
        checkboxGroupIndex,
        checkboxOptionIndex,
      ] of checkboxSelection) {
        await checkout.checkboxes.clickCheckbox(
          checkboxGroupIndex,
          checkboxOptionIndex
        );
      }
      await checkout.enterSld(sldValue);
      await checkout.registrantNameInput.fill(registrantName);
      await checkout.registrantOrgInput.fill(registrantOrg);
      await checkout.registrantEmailInput.fill(registrantEmail);
      await checkout.registrantPhoneInput.fill(registrantPhone);
      await checkout.registrantAddr1Input.fill(registrantAddr1);
      await checkout.registrantCityInput.fill(registrantCity);
      await checkout.registrantStateInput.fill(registrantState);
      await checkout.registrantPostcodeInput.fill(registrantPostcode);
      await checkout.registrantCountryInput.click();
      await checkout.select.getSelectOption(registrantCountry);

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(checkout.totalValue).toContainText(total);
      await expect(checkout.billingCycle).toContainText(billingCycle);
      await expect(checkout.registrantName).toContainText(registrantName);
      await expect(checkout.registrantOrg).toContainText(registrantOrg);
      await expect(checkout.registrantEmail).toContainText(registrantEmail);
      await expect(checkout.registrantPhone).toContainText(registrantPhone);
      await expect(checkout.registrantAddr1).toContainText(registrantAddr1);
      await expect(checkout.registrantCity).toContainText(registrantCity);
      await expect(checkout.registrantState).toContainText(registrantState);
      await expect(checkout.registrantPostcode).toContainText(
        registrantPostcode
      );
      await expect(checkout.registrantCountry).toContainText(registrantCountry);
      await expect(checkout.tldValue).toContainText(tldValue);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
