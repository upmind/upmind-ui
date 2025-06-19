import { test, expect } from "@playwright/test";
import { URLs } from "../../../../support/constants/Urls";
import { ProductConfig } from "../../../../support/page-objects/templates/ProductConfig";
import { LogoDesign } from "../../../../support/constants/checkout/test-cases/webcentral/LogoDesign";
let productConfig: ProductConfig;
let testCases = LogoDesign;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.logoDesign);
  await productConfig.optionsContainer.waitFor();
});

test.describe("Product Config - Happy Paths - Logo Design", async () => {
  for (const {
    name,
    radioSelection = [],
    total,
    billingCycle,
    designServices,
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
      await expect(productConfig.designServices).toContainText(designServices);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
