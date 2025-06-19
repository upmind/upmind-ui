import { test, expect } from "@playwright/test";
import { URLs } from "../../../../support/constants/Urls";
import { ProductConfig } from "../../../../support/page-objects/templates/ProductConfig";
import { DeveloperRetainer } from "../../../../support/constants/checkout/test-cases/webcentral/DeveloperRetainer";
let productConfig: ProductConfig;
let testCases = DeveloperRetainer;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.developerRetainer);
  await productConfig.optionsContainer.waitFor();
});

test.describe("Product Config - Happy Paths - Developer Retainer", async () => {
  for (const {
    name,
    radioSelection = [],
    total,
    billingCycle,
    development,
    addons = [],
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

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(productConfig.totalValue).toContainText(total);
      await expect(productConfig.billingCycle).toContainText(billingCycle);
      await expect(productConfig.development).toContainText(development);
      await expect(productConfig.addons).toContainText(addons);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
