import { test, expect } from "@playwright/test";
import { URLs } from "../../../../../support/constants/urls";
import { ProductConfig } from "../../../../../support/page-objects/templates/ProductConfig";
import { cozaDomain } from "../../../../../support/constants/checkout/test-cases/webcentral/domains/Co.za";
let productConfig: ProductConfig;
let testCases = cozaDomain;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.cozaDomain);
  await productConfig.optionsContainer.waitFor();
});

test.describe("Product Config - Happy Paths - Domain (.co.za)", async () => {
  for (const {
    name,
    radioSelection = [],
    sldValue,
    total,
    billingCycle,
    tldValue,
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
      await productConfig.enterSld(sldValue);

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(productConfig.totalValue).toContainText(total);
      await expect(productConfig.billingCycle).toContainText(billingCycle);
      await expect(productConfig.tldValue).toContainText(tldValue);
      //await expect(page).toHaveScreenshot(name);
    });
  }
});
