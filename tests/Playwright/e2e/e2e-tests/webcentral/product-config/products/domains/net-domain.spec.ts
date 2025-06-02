import { test, expect } from "@playwright/test";
import { URLs } from "../../../../../support/constants/urls";
import { Checkout } from "../../../../../support/page-objects/templates/Checkout";
import { netDomain } from "../../../../../support/constants/checkout/test-cases/webcentral/domains/Net";
let checkout: Checkout;
let testCases = netDomain;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
  await page.goto(URLs.netDomain);
  await checkout.optionsContainer.waitFor();
});

test.describe("Product Config - Happy Paths - Domain (.net)", async () => {
  for (const {
    name,
    radioSelection = [],
    checkboxSelection = [],
    sldValue,
    total,
    billingCycle,
    tldValue,
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
      await checkout.enterSld(sldValue);

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(checkout.totalValue).toContainText(total);
      await expect(checkout.billingCycle).toContainText(billingCycle);
      await expect(checkout.tldValue).toContainText(tldValue);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
