import { test, expect } from "@playwright/test";
import { URLs } from "../../../../../support/constants/Urls";
import { ProductConfig } from "../../../../../support/page-objects/templates/ProductConfig";
import { orgDomain } from "../../../../../support/constants/checkout/test-cases/webcentral/domains/Org";
let productConfig: ProductConfig;
let testCases = orgDomain;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.orgDomain);
  await productConfig.optionsContainer.waitFor();
});

test.describe.skip("Product Config - Happy Paths - Domain (.org)", async () => {
  for (const {
    name,
    radioSelection = [],
    checkboxSelection = [],
    sldValue,
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

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(productConfig.totalValue).toContainText(total);
      await expect(productConfig.billingCycle).toContainText(billingCycle);
      await expect(productConfig.tldValue).toContainText(tldValue);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
