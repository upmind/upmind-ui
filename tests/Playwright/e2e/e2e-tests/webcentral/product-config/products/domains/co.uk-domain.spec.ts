import { test, expect } from "@playwright/test";
import { URLs } from "../../../../../support/constants/urls";
import { ProductConfig } from "../../../../../support/page-objects/templates/ProductConfig";
import { coukDomain } from "../../../../../support/constants/checkout/test-cases/webcentral/domains/Co.uk";
let productConfig: ProductConfig;
let testCases = coukDomain;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.coukDomain);
  await productConfig.optionsContainer.waitFor();
});

test.describe("Product Config - Domains (.co.uk)", async () => {
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
    tldValue
  } of testCases) {
    test(name, async ({ page }) => {
      /* PRODUCT OPTIONS */
      /* Make product selections */
      for (const [radioGroupIndex, radioOptionIndex] of radioSelection) {
        await productConfig.radioButtons.clickRadioButton(
          radioGroupIndex,
          radioOptionIndex
        );
      }
      for (const [
        checkboxGroupIndex,
        checkboxOptionIndex
      ] of checkboxSelection) {
        await productConfig.checkboxes.clickCheckbox(
          checkboxGroupIndex,
          checkboxOptionIndex
        );
      }
      await productConfig.enterSld(sldValue);
      await productConfig.registrantNameInput.fill(registrantName);
      await productConfig.registrantOrgInput.fill(registrantOrg);
      await productConfig.registrantEmailInput.fill(registrantEmail);
      await productConfig.registrantPhoneInput.fill(registrantPhone);
      await productConfig.registrantAddr1Input.fill(registrantAddr1);
      await productConfig.registrantCityInput.fill(registrantCity);
      await productConfig.registrantStateInput.fill(registrantState);
      await productConfig.registrantPostcodeInput.fill(registrantPostcode);
      await productConfig.registrantCountryInput.click();
      await productConfig.select.getSelectOption(registrantCountry);

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(productConfig.totalValue).toContainText(total);
      await expect(productConfig.billingCycle).toContainText(billingCycle);
      await expect(productConfig.registrantName).toContainText(registrantName);
      await expect(productConfig.registrantOrg).toContainText(registrantOrg);
      await expect(productConfig.registrantEmail).toContainText(
        registrantEmail
      );
      await expect(productConfig.registrantPhone).toContainText(
        registrantPhone
      );
      await expect(productConfig.registrantAddr1).toContainText(
        registrantAddr1
      );
      await expect(productConfig.registrantCity).toContainText(registrantCity);
      await expect(productConfig.registrantState).toContainText(
        registrantState
      );
      await expect(productConfig.registrantPostcode).toContainText(
        registrantPostcode
      );
      await expect(productConfig.registrantCountry).toContainText(
        registrantCountry
      );
      await expect(productConfig.tldValue).toContainText(tldValue);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
