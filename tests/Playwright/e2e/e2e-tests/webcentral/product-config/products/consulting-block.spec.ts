import { test, expect } from "@playwright/test";
import { URLs } from "../../../../support/constants/Urls";
import { ProductConfig } from "../../../../support/page-objects/templates/ProductConfig";
import { ConsultingBlock } from "../../../../support/constants/checkout/test-cases/webcentral/ConsultingBlock";
let productConfig: ProductConfig;
let testCases = ConsultingBlock;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.consultingBlock);
  await productConfig.optionsContainer.waitFor();
});

test.describe("Product Config - Happy Paths - Consulting Block", async () => {
  for (const {
    name,
    radioSelection = [],
    checkboxSelection = [],
    total,
    billingCycle,
    consulting,
    engagementTypes,
    outcomes = [],
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
        checkboxOptionIndex,
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
      await expect(productConfig.consulting).toContainText(consulting);
      await expect(productConfig.engagementTypes).toContainText(
        engagementTypes
      );
      await expect(productConfig.outcomes).toContainText(outcomes);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
