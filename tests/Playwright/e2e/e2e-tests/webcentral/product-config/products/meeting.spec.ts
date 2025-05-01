import { test, expect } from "@playwright/test";
import { URLs } from "../../../../support/constants/urls";
import { Checkout } from "../../../../support/page-objects/templates/Checkout";
import { Meeting } from "../../../../support/constants/checkout/test-cases/webcentral/Meeting";
let checkout: Checkout;
let testCases = Meeting;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
  await page.goto(URLs.meeting);
  await checkout.optionsContainer.waitFor();
});

test.describe("Product Config - Happy Paths - Meeting", async () => {
  for (const {
    name,
    radioSelection = [],
    checkboxSelection = [],
    total,
    billingCycle,
    consulting,
    meetingTypes = [],
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
      await expect(checkout.meetingTypes).toContainText(meetingTypes);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
