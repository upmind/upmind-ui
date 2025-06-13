import { test, expect } from "@playwright/test";
import { ProductConfig } from "../support/page-objects/templates/ProductConfig";
import { URLs } from "../support/constants/urls";

let productConfig: ProductConfig;

test.describe("Product Config Meta Elements", () => {
  test.beforeEach(({ page }) => {
    productConfig = new ProductConfig(page);
  });
  test("Summary Meta Slot", async ({ page }) => {
    await page.goto(URLs.starterHosting);
    await expect(productConfig.summaryMetaSlot).toBeDefined();
  });
});
