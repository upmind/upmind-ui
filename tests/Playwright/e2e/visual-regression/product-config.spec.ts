import { test, expect } from "@playwright/test";
import { ProductConfig } from "../support/page-objects/templates/product-config";
import { URLs } from "../support/constants/urls";
import { setLocale } from "../support/helpers/locale";
import { Languages as languages } from "../support/constants/languages";

let productConfig: ProductConfig;

for (const { language, locale } of languages) {
  test.describe(`Product Configuration Visual Regression Tests - ${language}`, () => {
    test.beforeEach(async ({ page }) => {
      productConfig = new ProductConfig(page);
      // Disable all CSS animations and transitions
      await page.addStyleTag({
        content: `
              *,
              *::before,
              *::after {
                  transition: none !important;
                  animation: none !important;
                  caret-color: transparent !important;
              }
              `
      });
    });
    test("Hosting Product", async ({ page }) => {
      await page.goto(URLs.starterHosting);
      await setLocale(page, locale);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${language}/hosting-product`, {
        fullPage: true
      });
    });
    test("Domain Drawer", async ({ page }) => {
      await page.goto(URLs.starterHosting);
      await setLocale(page, locale);
      await page.waitForLoadState("networkidle");
      await productConfig.domainRegister.click();
      await productConfig.domainRegister
        .getByTestId("accordion-content")
        .locator("input")
        .fill("visualregression");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("dac-results")).toBeVisible();
      await expect(page).toHaveScreenshot(`${language}/domain-drawer`, {
        fullPage: true
      });
    });
    test("Domain Product", async ({ page }) => {
      await page.goto(URLs.ukDomain);
      await setLocale(page, locale);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${language}/domain-product`, {
        fullPage: true
      });
    });
    test("Product Config Drawer", async ({ page }) => {
      await page.goto(URLs.recommendations1);
      await setLocale(page, locale);
      await page.waitForLoadState("networkidle");
      await productConfig.addToBasket.click();
      await expect(page.url()).toContain("/recommendations/");
      await page.getByTestId("button-add-to-basket").click();
      await expect(page.getByRole("dialog")).toContainText(
        "Configure your product"
      );
      await expect(page).toHaveScreenshot(`${language}/product-config-drawer`, {
        fullPage: true
      });
    });
  });
}
