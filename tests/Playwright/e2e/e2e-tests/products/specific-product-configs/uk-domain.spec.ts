import { test, expect } from "@playwright/test";
import { URLs } from "../../../support/constants/urls";
import { ProductConfig } from "../../../support/page-objects/templates/ProductConfig";
import { ukDomain } from "../../../support/constants/checkout/test-cases/webcentral/domains/Uk";
let productConfig: ProductConfig;
let testCases = ukDomain;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.ukDomain);
  await productConfig.optionsContainer.waitFor();
});

test.describe("Product Config - Domains (.uk)", async () => {
  for (const {
    name,
    billingTerm,
    transfer,
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
      await productConfig.clickBillingTerm(billingTerm);
      if (transfer === true) {
        await productConfig.checkboxes.checkboxOption.first().click();
      }
      await productConfig.enterSld(sldValue);
      await productConfig.enterRegistrantDetails(
        `${registrantName}`,
        `${registrantOrg}`,
        `${registrantEmail}`,
        `${registrantPhone}`,
        `${registrantAddr1}`,
        `${registrantCity}`,
        `${registrantState}`,
        `${registrantPostcode}`,
        `${registrantCountry}`
      );

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
        "United Kingdom"
      );
      await expect(productConfig.tldValue).toContainText(tldValue);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
