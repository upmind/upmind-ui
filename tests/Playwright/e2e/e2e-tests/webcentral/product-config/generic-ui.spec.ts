import { test, expect } from "@playwright/test";
import { URLs } from "../../../support/constants/urls";
import { ProductConfig } from "../../../support/page-objects/templates/ProductConfig";
let productConfig: ProductConfig;

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
  await page.goto(URLs.starterHosting);
  await productConfig.optionsContainer.waitFor();
});

test.describe("Checkout - Generic UI Checks", async () => {
  test("Initial Page Load - Visual Regression", async ({ page }) => {
    //await expect(page).toHaveScreenshot("Checkout - Page Load.png");
  });
  test("Product Description - Show more/Show Less", async () => {
    await expect(productConfig.optionsContainer).toHaveScreenshot(
      "Checkout - Lineclamp Applied.png"
    );
    await productConfig.clickLineclamp();
    await expect(productConfig.optionsContainer).toHaveScreenshot(
      "Checkout - Lineclamp Removed.png"
    );
  });
});
