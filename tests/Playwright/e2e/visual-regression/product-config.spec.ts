import { test, expect } from "@playwright/test";
import { ProductConfig } from "../support/page-objects/templates/product-config";
import { URLs } from "../support/constants/urls";
import { products } from "../support/constants/products";
import { interceptProductsToRecommend } from "../support/mocks";
import { setLocale } from "../support/helpers/locale";
import { Languages as languages } from "../support/constants/languages";
import { waitForSessionCookie } from "../support/helpers";

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
      await waitForSessionCookie(page.context());
      await expect(productConfig.configForm).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`${language}/hosting-product`, {
        fullPage: true
      });
    });
    test("Domain Drawer", async ({ page }) => {
      await page.goto(URLs.starterHosting);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      // Locale-independent: the page object's enterDomainRadio locates the
      // radio by English label and the input by English placeholder, so it
      // only works in en. Select the register radio by its DomainTypes value
      // id (#register) and type into the auto-focused search input instead.
      await page.locator("#register").click();
      await page.keyboard.type("visualregression");
      await page.keyboard.press("Enter");
      await expect(productConfig.domainResults).toBeVisible({ timeout: 15000 });
      await expect(page).toHaveScreenshot(`${language}/domain-drawer`, {
        fullPage: true
      });
    });
    test("Domain Product", async ({ page }) => {
      await page.goto(URLs.ukDomain);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(productConfig.configForm).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`${language}/domain-product`, {
        fullPage: true
      });
    });
    test("Product Config Drawer", async ({ page, context }) => {
      // Inject a configurable hosting recommendation so reaching the
      // recommendations step is deterministic instead of depending on staging
      // recommendation config for the base product. Locators are testid-based
      // (not text/role-name) so they hold across every locale this suite runs.
      interceptProductsToRecommend(context, [
        { object_id: products.STARTER_HOSTING.id }
      ]);
      await page.goto(URLs.recommendations1);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await productConfig.addToBasket.click();
      await page.waitForURL(/\/recommendations\/?$/);
      const card = page.getByTestId("carousel-card").first();
      await expect(card).toBeVisible();
      await card.getByTestId("product-card-cta").click();
      // Post-FE-2703 a configurable recommendation opens its own product config
      // route — the old "Configure your product" drawer was replaced by
      // navigation. Wait for that route and the config section (locale-stable
      // testid; the add-to-basket button testid is label-derived, so it isn't).
      await page.waitForURL(/\/order\/product\//);
      await page.waitForLoadState("load");
      await expect(productConfig.configForm).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`${language}/product-config-drawer`, {
        fullPage: true
      });
    });
  });
}
