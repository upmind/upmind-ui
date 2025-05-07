import { test, expect } from "@playwright/test";
import { URLs } from "../../../../support/constants/urls";
import { Checkout } from "../../../../support/page-objects/templates/Checkout";
import { ConsultingBlock } from "../../../../support/constants/checkout/test-cases/webcentral/ConsultingBlock";
let checkout: Checkout;
let testCases = ConsultingBlock;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
  await page.goto(URLs.consultingBlock);
  await checkout.optionsContainer.waitFor();
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
      await expect(checkout.consulting).toContainText(consulting);
      await expect(checkout.engagementTypes).toContainText(engagementTypes);
      await expect(checkout.outcomes).toContainText(outcomes);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
