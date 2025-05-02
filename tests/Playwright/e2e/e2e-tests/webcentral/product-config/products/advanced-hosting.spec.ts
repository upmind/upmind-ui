import { test, expect } from "@playwright/test";
import { URLs } from "../../../../support/constants/urls";
import { Checkout } from "../../../../support/page-objects/templates/Checkout";
import { AdvancedHosting } from "../../../../support/constants/checkout/test-cases/webcentral/AdvancedHosting";
let checkout: Checkout;
let testCases = AdvancedHosting;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
  await page.goto(URLs.advancedHosting);
  await page.waitForLoadState();
});

test.describe("Product Config - Happy Paths - Advanced Hosting", async () => {
  for (const {
    name,
    radioSelection = [],
    accordionSelection,
    total,
    billingCycle,
    webHosting,
    domainName,
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
      for (const accordionItem of accordionSelection) {
        await checkout.accordion.clickAccordion(accordionItem);
      }
      if (!accordionSelection.includes(3)) {
        await checkout.domainInput.fill(domainName);
      }
      if (!accordionSelection.includes(2) && !accordionSelection.includes(3)) {
        await checkout.drawer.focus();
        await checkout.clickAddButton(2); // should change this to be in the constants
        await checkout.addDomainToBasket.click();
      }

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(checkout.totalValue).toContainText(total);
      await expect(checkout.billingCycle).toContainText(billingCycle);
      await expect(checkout.webHosting).toContainText(webHosting);
      await expect(checkout.domainName).toContainText(domainName);
      //await expect(page).toHaveScreenshot(name);

      /* INLINE DROPDOWN */
      /*Verify that the domain basket inline dropdown contains the new domain name - not applicable for 'Existing Domain' or 'Domain in Basket' */
      if (!accordionSelection.includes(2) && !accordionSelection.includes(3)) {
        await expect(checkout.accordion.getAccordion(3)).toContainText(
          domainName
        );
      }
    });
  }
});
