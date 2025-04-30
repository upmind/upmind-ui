import { test, expect } from "@playwright/test";
import { URLs } from "../../../../support/constants/urls";
import { Checkout } from "../../../../support/page-objects/templates/Checkout";
import { DeveloperRetainer } from "../../../../support/constants/checkout/test-cases/webcentral/DeveloperRetainer";
let checkout: Checkout;
let testCases = DeveloperRetainer;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
  await page.goto(URLs.developerRetainer);
  await checkout.optionsContainer.waitFor();
});

test.describe("Product Config - Happy Paths - Developer Retainer", async () => {
  for (const {
    name,
    radioSelection = [],
    total,
    billingCycle,
    //product,
    addons = "",
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

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(checkout.totalValue).toContainText(total);
      await expect(checkout.billingCycle).toContainText(billingCycle);
      //await expect(checkout.product).toContainText(product);
      await expect(checkout.addons).toContainText(addons);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
