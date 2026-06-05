import { test, expect } from "@playwright/test";
import { interceptUISchema } from "../../support/mocks/brand";
import { URLs } from "../../support/constants/urls";
import { ProductConfig } from "../../support/page-objects/templates/product-config";

let productConfig: ProductConfig;

test.describe("Product UI Metadata Tests", () => {
  test.beforeEach(async ({ page }) => {
    productConfig = new ProductConfig(page);
  });
  test("Billing Terms - Display as dropdown", async ({ page, context }) => {
    await interceptUISchema(context, {
      "@context.configure.termSelector": "select"
    });
    await page.goto(URLs.uiTestProduct);
    await page.waitForLoadState("load");
    await expect(productConfig.billingTerms).toBeVisible();
    await expect(page).toHaveScreenshot(
      "uimetadata-billing-term-dropdown-closed"
    );
    await productConfig.billingTerms.locator("button").click();
    await expect(page).toHaveScreenshot(
      "uimetadata-billing-term-dropdown-open"
    );
  });
  // TODO: add coverage for the following UI Metadata features:
  //   - Custom HTML slots: https://upmind-app.notion.site/Custom-HTML-Slots-1b6782386d4180bcafc5ed5226ffe30c
  //   - Custom Product Title: https://upmind-app.notion.site/Custom-Dynamic-Product-Titles-1b6782386d41806a8cbff4b446ccb3d3
  //   - Custom Summary Items: https://upmind-app.notion.site/Custom-Dynamic-Summary-Items-1b9782386d4180df9bfdfab9c4cd84e3
});
