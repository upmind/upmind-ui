import { expect, newUser } from "../support/fixtures/auth-context";

import { URLs } from "../support/constants/urls";
import { products } from "../support/constants/products";
import { Languages as languages } from "../support/constants/languages";
import { ProductSetup } from "../support/page-objects/templates/product-setup";
import { ProductConfig } from "../support/page-objects/templates/product-config";

import { fillRegistrantDetails, seedInvalidProduct } from "../support/flows";
import { interceptUISchema } from "../support/mocks/brand";
import { returnError } from "../support/mocks";
import { setLocale } from "../support/helpers/locale";

const SETUP_URL = `${URLs.baseUrl}order/basket/products-setup/`;
const TEMPLATES = [
  "full",
  "two-column-ltr",
  "two-column-rtl",
  "enclosed"
] as const;

// Force the products-setup submit to fail so the error state renders
// deterministically. The submit hits the order-root PUT (/api/orders/{id}),
// NOT /orders/{id}/products — matching the functional suite
// (e2e-tests/products/product-setup.spec.ts) so the alert actually shows
// instead of depending on staging organically rejecting the data.
const ORDER_PUT = /\/api\/orders\/[a-f0-9-]+(\?|$)/;
const forcedError = {
  id: null,
  type: 1,
  code: 422,
  message: "Forced failure for snapshot"
};

let productSetup: ProductSetup;
let productConfig: ProductConfig;

// Each test registers a fresh client via the `newUser` fixture, so the suite
// is safe to run fully parallel. The previous shared-account approach
// (loginAsIncompleteCustomer) is serial-only and collided across workers on a
// single staging basket.
newUser.describe.configure({ mode: "parallel" });

for (const { language, locale } of languages) {
  newUser.describe(`Product Setup Visual Regression — ${language}`, () => {
    newUser.beforeEach(async ({ page }) => {
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
      newUser(
        `Single product setup (no apply-to-others) — ${template}`,
        async ({ page, context }) => {
          interceptUISchema(context, {
            "@context.configure.template": template
          });
          await seedInvalidProduct(page, products.DOMAIN_2);
          await page.goto(SETUP_URL);
          await setLocale(page, locale);
          await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
          await expect(page).toHaveScreenshot(
            `${language}/product-setup-single-${template}`,
            { fullPage: true }
          );
        }
      );

      newUser(
        `Multi-product with apply-to-others — ${template}`,
        async ({ page, context }) => {
          interceptUISchema(context, {
            "@context.configure.template": template
          });
          await seedInvalidProduct(page, products.DOMAIN_2);
          await seedInvalidProduct(page, products.DOMAIN_3);
          await page.goto(SETUP_URL);
          await setLocale(page, locale);
          await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
          await expect(productSetup.applyToOthersGroup).toBeVisible();
          await expect(page).toHaveScreenshot(
            `${language}/product-setup-multi-${template}`,
            { fullPage: true }
          );
        }
      );

      newUser(`Deferred mode — ${template}`, async ({ page, context }) => {
        interceptUISchema(context, {
          "@context.configure.template": template,
          "@context.configure.productSetup": "deferred"
        });
        // SERVER_B is deferred-only: with no errored required field the funnel
        // skips products-setup → checkout, so the form never renders. DOMAIN_2
        // has errored registrant fields, so the setup form shows in deferred
        // mode (the deferred schema just adds the deferred fields alongside).
        await seedInvalidProduct(page, products.DOMAIN_2);
        await page.goto(SETUP_URL);
        await setLocale(page, locale);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
        await expect(page).toHaveScreenshot(
          `${language}/product-setup-deferred-${template}`,
          { fullPage: true }
        );
      });

      newUser(`Error state — ${template}`, async ({ page, context }) => {
        interceptUISchema(context, { "@context.configure.template": template });
        await seedInvalidProduct(page, products.DOMAIN_2);
        await page.goto(SETUP_URL);
        await setLocale(page, locale);
        await expect(productSetup.setupForm).toBeVisible({ timeout: 15000 });
        await returnError(page, ORDER_PUT, 422, forcedError);
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
