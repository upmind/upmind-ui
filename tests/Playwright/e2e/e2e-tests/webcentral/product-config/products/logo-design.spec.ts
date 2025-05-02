import { test, expect } from "@playwright/test";
import { URLs } from "../../../../support/constants/urls";
import { Checkout } from "../../../../support/page-objects/templates/Checkout";
import { LogoDesign } from "../../../../support/constants/checkout/test-cases/webcentral/LogoDesign";
let checkout: Checkout;
let testCases = LogoDesign;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
  await page.goto(URLs.logoDesign);
  await checkout.optionsContainer.waitFor();
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
        await checkout.radioButtons.clickRadioButton(
          radioGroupIndex,
          radioOptionIndex
        );
      }

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(checkout.totalValue).toContainText(total);
      await expect(checkout.billingCycle).toContainText(billingCycle);
      await expect(checkout.designServices).toContainText(designServices);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
