import { test, expect } from "@playwright/test";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { URLs } from "../../support/constants/urls";
import { interceptProductMeta } from "../../support/mocks/index";

let productConfig: ProductConfig;
test.describe("Product Config Meta Elements", () => {
  test.beforeEach(({ page }) => {
    productConfig = new ProductConfig(page);
  });
  test("Summary Meta Slot - Applied to product", async ({ page }) => {
    interceptProductMeta(page, {
      "@data.trustMessagingMarkdown": "<h1><i>Test heading</i></h1>"
    });
    await page.goto(`${URLs.consultingBlock}?force=true&navigateOnly=true`);
    await expect(productConfig.summaryMetaSlot).toHaveCount(1);
  });
});
