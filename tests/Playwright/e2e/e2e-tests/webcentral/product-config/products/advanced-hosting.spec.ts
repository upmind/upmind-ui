import { test, expect } from "@playwright/test";
import { URLs } from "../../../../support/constants/Urls";
import { ProductConfig } from "../../../../support/page-objects/templates/ProductConfig";
import { AdvancedHosting } from "../../../../support/constants/checkout/test-cases/webcentral/AdvancedHosting";
let productConfig: ProductConfig;
let testCases = AdvancedHosting;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.advancedHosting);
  await page.waitForLoadState();
});

test.describe("Product Config - Happy Paths - Advanced Hosting", async () => {
  for (const {
    name,
    radioSelection = [],
    accordionSelection,
    total,
    billingCycle,
    webHosting,
    domainName,
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
      for (const accordionItem of accordionSelection) {
        await productConfig.accordion.clickAccordion(accordionItem);
      }
      if (!accordionSelection.includes(3)) {
        await productConfig.domainInput.fill(domainName);
      }
      if (!accordionSelection.includes(2) && !accordionSelection.includes(3)) {
        await productConfig.drawer.focus();
        await productConfig.clickAddButton(2); // should change this to be in the constants
        await productConfig.addDomainToBasket.click();
      }

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(productConfig.totalValue).toContainText(total);
      await expect(productConfig.billingCycle).toContainText(billingCycle);
      await expect(productConfig.webHosting).toContainText(webHosting);
      await expect(productConfig.domainName).toContainText(domainName);
      //await expect(page).toHaveScreenshot(name);

      /* INLINE DROPDOWN */
      /*Verify that the domain basket inline dropdown contains the new domain name - not applicable for 'Existing Domain' or 'Domain in Basket' */
      if (!accordionSelection.includes(2) && !accordionSelection.includes(3)) {
        await expect(productConfig.accordion.getAccordion(3)).toContainText(
          domainName
        );
      }
    });
  }
});
