import { test, expect } from "@playwright/test";
import { ProductConfig } from "../support/page-objects/templates/ProductConfig";
import { URLs } from "../support/constants/Urls";

let productConfig: ProductConfig;

test.describe("Product Config Meta Elements", () => {
  test.beforeEach(({ page }) => {
    productConfig = new ProductConfig(page);
  });
  test("Summary Meta Slot - Applied to product", async ({ page }) => {
    await page.goto(URLs.consultingBlock);
    await expect(productConfig.summaryMetaSlot).toHaveCount(1);
  });
  test("Summary Meta Slot - Applied to category", async ({ page }) => {
    await page.goto(URLs.goldPlanHosting);
    await expect(productConfig.summaryMetaSlot).toHaveCount(1);
  });
  test("Summary Meta Slot - Applied to category and product", async ({
    page
  }) => {
    await page.goto(URLs.starterHosting);
    await expect(productConfig.summaryMetaSlot).toHaveCount(1);
  });
});
