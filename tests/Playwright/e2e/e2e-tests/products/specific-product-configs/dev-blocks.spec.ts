import { test, expect } from "@playwright/test";
import { URLs } from "../../../support/constants/urls";
import { ProductConfig } from "../../../support/page-objects/templates/ProductConfig";
import { DevBlocks } from "../../../support/constants/checkout/test-cases/DevBlocks";
import { kebabCase } from "../../../support/utils/functions/helpers";
let productConfig: ProductConfig;
let testCases = DevBlocks;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.devBlocks);
  await page.waitForLoadState("networkidle");
});

test.describe("Product Config - Happy Paths - Dev Blocks", async () => {
  for (const {
    name,
    billingTerm,
    total,
    billingCycle,
    development,
    bundle,
    addons
  } of testCases) {
    test(name, async ({ page }) => {
      /* PRODUCT OPTIONS */
      /* Make product selections */
      await productConfig.selectRadioOption(billingTerm);
      await page.getByTestId(`radio-card-${kebabCase(bundle)}`).click();
      await page.getByTestId(`radio-card-${kebabCase(addons)}`).click();

      /* SUMMARY FIELDS */
      /* Verify that all summary fields contain the expected data */
      await expect(productConfig.totalValue).toContainText(total);
      await expect(productConfig.development).toContainText(development);
      await expect(productConfig.bundle).toContainText(bundle);
      await expect(productConfig.addons).toContainText(addons);
    });
  }
});
