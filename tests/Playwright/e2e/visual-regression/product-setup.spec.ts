import { test, expect, type Route } from "@playwright/test";

import { URLs } from "../support/constants/urls";
import { products } from "../support/constants/products";
import { Languages as languages } from "../support/constants/languages";
import { ProductSetup } from "../support/page-objects/templates/product-setup";
import { ProductConfig } from "../support/page-objects/templates/product-config";

import {
  fillRegistrantDetails,
  loginAsIncompleteCustomer,
  seedInvalidProduct
} from "../support/flows";
import { interceptUISchema } from "../support/mocks/brand";
import { setLocale } from "../support/helpers/locale";

const SETUP_URL = `${URLs.baseUrl}order/basket/products-setup/`;
const TEMPLATES = [
  "full",
  "two-column-ltr",
  "two-column-rtl",
  "enclosed"
] as const;

let productSetup: ProductSetup;
let productConfig: ProductConfig;

const failApply = (route: Route) => {
  if (route.request().method() !== "PUT") return route.continue();
  return route.fulfill({
    status: 422,
    contentType: "application/json",
    body: JSON.stringify({ error: { message: "Forced failure for snapshot" } })
  });
};

for (const { language, locale } of languages) {
  test.describe(`Product Setup Visual Regression — ${language}`, () => {
    test.beforeEach(async ({ page }) => {
      productSetup = new ProductSetup(page);
      productConfig = new ProductConfig(page);
      await page.addStyleTag({
        content: `*, *::before, *::after {
          transition: none !important;
          animation: none !important;
          caret-color: transparent !important;
        }`
      });
    });

    for (const template of TEMPLATES) {
      test(`Single product setup (no apply-to-others) — ${template}`, async ({
        page,
        context
      }) => {
        interceptUISchema(context, { "@context.checkout.template": template });
        const token = await loginAsIncompleteCustomer(page, context);
        await seedInvalidProduct(products.DOMAIN_2, token);
        await page.goto(SETUP_URL);
        await setLocale(page, locale);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
        await expect(page).toHaveScreenshot(
          `${language}/product-setup-single-${template}`,
          { fullPage: true }
        );
      });

      test(`Multi-product with apply-to-others — ${template}`, async ({
        page,
        context
      }) => {
        interceptUISchema(context, { "@context.checkout.template": template });
        const token = await loginAsIncompleteCustomer(page, context);
        await seedInvalidProduct(products.DOMAIN_2, token);
        await seedInvalidProduct(products.DOMAIN_3, token);
        await page.goto(SETUP_URL);
        await setLocale(page, locale);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
        await expect(productSetup.applyToOthersGroup).toBeVisible();
        await expect(page).toHaveScreenshot(
          `${language}/product-setup-multi-${template}`,
          { fullPage: true }
        );
      });

      test(`Deferred mode — ${template}`, async ({ page, context }) => {
        interceptUISchema(context, {
          "@context.checkout.template": template,
          "@context.checkout.productSetup": "deferred"
        });
        const token = await loginAsIncompleteCustomer(page, context);
        await seedInvalidProduct(products.SERVER_B, token);
        await page.goto(SETUP_URL);
        await setLocale(page, locale);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
        await expect(page).toHaveScreenshot(
          `${language}/product-setup-deferred-${template}`,
          { fullPage: true }
        );
      });

      test(`Error state — ${template}`, async ({ page, context }) => {
        interceptUISchema(context, { "@context.checkout.template": template });
        const token = await loginAsIncompleteCustomer(page, context);
        await seedInvalidProduct(products.DOMAIN_2, token);
        await context.route(/\/api\/orders\/.*\/products/, failApply);

        await page.goto(SETUP_URL);
        await setLocale(page, locale);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
        await fillRegistrantDetails(productConfig);
        await productSetup.submit();
        await expect(productSetup.errorAlert).toBeVisible({ timeout: 10000 });
        await expect(page).toHaveScreenshot(
          `${language}/product-setup-error-${template}`,
          { fullPage: true }
        );
      });
    }
  });
}
