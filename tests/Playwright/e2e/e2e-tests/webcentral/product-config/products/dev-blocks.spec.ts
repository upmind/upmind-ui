import { test, expect } from "@playwright/test";
import { URLs } from "../../../../support/constants/urls";
import { Checkout } from "../../../../support/page-objects/templates/Checkout";
import { DevBlocks } from "../../../../support/constants/checkout/test-cases/webcentral/DevBlocks";
let checkout: Checkout;
let testCases = DevBlocks;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
  await page.goto(URLs.devBlocks);
  await checkout.optionsContainer.waitFor();
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

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(checkout.totalValue).toContainText(total);
      await expect(checkout.billingCycle).toContainText(billingCycle);
      await expect(checkout.development).toContainText(development);
      await expect(checkout.bundle).toContainText(bundle);
      await expect(checkout.addons).toContainText(addons);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
