import { test, expect } from "@playwright/test";
import { interceptProductMeta } from "../../support/utils/functions/product";
import { URLs } from "../../support/constants/urls";
import { ProductConfig } from "../../support/page-objects/templates/ProductConfig";

let productConfig: ProductConfig;

test.describe("Product UI Metadata Tests", () => {
  test.beforeEach(async ({ page }) => {
    productConfig = new ProductConfig(page);
  });
  test("Billing Terms - Display as dropdown", async ({ page }) => {
    await interceptProductMeta(page, {
      uischema: {
        billing: {
          control: "TermsConfigSelect"
        }
      }
    });
    await page.goto(URLs.uiTestProduct);
    await page.waitForLoadState("load");
    await expect(productConfig.billingTerms).toBeVisible();
    await expect(page).toHaveScreenshot(
      "uimetadata-billing-term-dropdown-closed"
    );
    await page.getByTestId("form-item-terms").locator("button").click();
    await expect(page).toHaveScreenshot(
      "uimetadata-billing-term-dropdown-open"
    );
  });
  test("Custom HTML slots", async ({ page }) => {}); //https://upmind-app.notion.site/Custom-HTML-Slots-1b6782386d4180bcafc5ed5226ffe30c
  test("Custom Product Title", async ({ page }) => {}); //https://upmind-app.notion.site/Custom-Dynamic-Product-Titles-1b6782386d41806a8cbff4b446ccb3d3
  test("Custom Summary Items", async ({ page }) => {}); //https://upmind-app.notion.site/Custom-Dynamic-Summary-Items-1b9782386d4180df9bfdfab9c4cd84e3
});
