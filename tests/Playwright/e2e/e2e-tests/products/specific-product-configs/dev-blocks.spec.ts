import { test, expect } from "@playwright/test";
import { URLs } from "../../../support/constants/urls";
import { ProductConfig } from "../../../support/page-objects/templates/ProductConfig";
import { DevBlocks } from "../../../support/constants/checkout/test-cases/webcentral/DevBlocks";
let productConfig: ProductConfig;
let testCases = DevBlocks;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.devBlocks);
  await productConfig.optionsContainer.waitFor();
});

test.describe("Product Config - Happy Paths - Dev Blocks", async () => {
  for (const {
    name,
    radioSelection = [],
    checkboxSelection = [],
    total,
    billingCycle,
    development,
    bundle,
    addons,
    tracking
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

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(productConfig.totalValue).toContainText(total);
      await expect(productConfig.billingCycle).toContainText(billingCycle);
      await expect(productConfig.development).toContainText(development);
      await expect(productConfig.bundle).toContainText(bundle);
      await expect(productConfig.addons).toContainText(addons);
      if (tracking !== undefined && tracking !== null) {
        await expect(productConfig.tracking).toContainText(tracking);
      } else {
        await expect(productConfig.tracking).toBeHidden();
      }
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
