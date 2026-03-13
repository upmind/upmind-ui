import { test, expect } from "@playwright/test";
import { URLs } from "../../../support/constants/urls";
import { ProductConfig } from "../../../support/page-objects/templates/ProductConfig";
import { StarterHosting } from "../../../support/constants/checkout/test-cases/StarterHosting";
let productConfig: ProductConfig;
let testCases = StarterHosting;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.starterHosting);
  await page.waitForLoadState("networkidle");
});

test.describe("Product Config - Happy Paths - Starter Hosting", async () => {
  for (const {
    name,
    billingTerm,
    total,
    billingCycle,
    addons,
    webHosting,
    domainName,
    domainSelection
  } of testCases) {
    test(name, async ({ page }) => {
      /* PRODUCT OPTIONS */
      /* Make product selections */
      await productConfig.selectRadioOption(billingTerm);
      if (domainSelection.includes(0)) {
        await productConfig.domainRegister.click();
        await productConfig.domainRegister
          .getByTestId("accordion-content")
          .locator("input")
          .fill(domainName);
        await productConfig.addDomain(domainName);
      }
      if (domainSelection.includes(1)) {
        await productConfig.domainTransfer.click();
        await productConfig.domainTransfer
          .getByTestId("accordion-content")
          .locator("input")
          .fill(domainName);
        await productConfig.addDomain(domainName);
      }
      if (domainSelection.includes(2)) {
        await productConfig.domainExisting.click();
        await productConfig.domainExisting
          .getByTestId("accordion-content")
          .locator("input")
          .fill(domainName);
      }

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(productConfig.totalValue).toContainText(total);
      await expect(productConfig.billingCycle).toContainText(billingCycle);
      await expect(productConfig.webHosting).toContainText(webHosting);
      //await expect(page).toHaveScreenshot(name);

      /* INLINE DROPDOWN */
      /*Verify that the domain basket inline dropdown contains the new domain name - not applicable for 'Existing Domain' or 'Domain in Basket' */
      if (!domainSelection.includes(2) && !domainSelection.includes(3)) {
        await expect(productConfig.domainBasket).toContainText(domainName);
      }
    });
  }
});
