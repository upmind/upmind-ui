import { test, expect } from "@playwright/test";
import { URLs } from "../../../support/constants/urls";
import { ProductConfig } from "../../../support/page-objects/templates/ProductConfig";
import { StarterHosting } from "../../../support/constants/checkout/test-cases/webcentral/StarterHosting";
let productConfig: ProductConfig;
let testCases = StarterHosting;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.starterHosting);
  await page.waitForLoadState();
});

test.describe("Product Config - Happy Paths - Starter Hosting", async () => {
  for (const {
    name,
    billingTerm,
    accordionSelection,
    total,
    billingCycle,
    webHosting,
    domainName
  } of testCases) {
    test(name, async ({ page }) => {
      /* PRODUCT OPTIONS */
      /* Make product selections */
      await productConfig.clickBillingTerm(billingTerm);
      for (const accordionItem of accordionSelection) {
        await productConfig.accordion.clickAccordion(accordionItem);
      }
      if (accordionSelection.includes(0)) {
        await productConfig.domainRegister.fill(domainName);
      }
      if (accordionSelection.includes(1)) {
        await productConfig.domainTransfer.fill(domainName);
      }
      if (accordionSelection.includes(2)) {
        await productConfig.domainExisting.fill(domainName);
      }
      if (!accordionSelection.includes(2) && !accordionSelection.includes(3)) {
        await productConfig.addDomain();
        await productConfig.domainAddToBasket.click();
      }

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(productConfig.totalValue).toContainText(total);
      await expect(productConfig.billingCycle).toContainText(billingCycle);
      await expect(productConfig.webHosting).toContainText(webHosting);
      await expect(productConfig.domainName).toContainText(domainName);
      //await expect(page).toHaveScreenshot(name);

      /* INLINE DROPDOWN */
      /*Verify that the domain basket inline dropdown contains the new domain name - not applicable for 'Existing Domain' or 'Domain in Basket' */
      if (!accordionSelection.includes(2) && !accordionSelection.includes(3)) {
        await expect(productConfig.accordion.getAccordion(3)).toContainText(
          domainName
        );
      }
    });
  }
});
