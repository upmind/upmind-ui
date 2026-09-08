import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import { Logins } from "../../support/constants/logins";
import { products } from "../../support/constants/products";
import { Login } from "../../support/page-objects/templates/login";
import { Registration } from "../../support/page-objects/templates/registration";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { loginViaHeadless } from "../../support/flows/auth-setup";
import { addProductViaHeadless } from "../../support/flows/basket-setup";
import { interceptUISchema } from "../../support/mocks/brand";
import { waitForSessionCookie } from "../../support/helpers/session";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Brand UI templates - the FUNCTIONAL half of the matrix.
 *
 * ## Job to be done
 * A brand drives each cart screen's layout with `@context.<area>.template` in
 * its UISchema. `validateTemplate` (e.g. `session/Login.vue:186-192`) resolves
 * that value against the area's own template enum and falls an absent or
 * unknown value back to the area's default. This asserts the consequence that
 * matters: whatever the brand asks for, the screen still renders its functional
 * surface. A template that resolves to nothing renders an empty page, and no
 * other spec would notice.
 *
 * ## Why not screenshots
 * The pixels of every (page x template) pair belong to
 * `visual-regression/template-matrix.spec.ts`, which holds the committed
 * baselines. This file used to duplicate that with 34 `toHaveScreenshot`
 * assertions and no baseline ever committed, so it was skipped wholesale
 * ("re-enable once UI template changes stabilise") and asserted nothing for its
 * whole life. Re-pointed at behaviour rather than pixels, per ADR-022.
 *
 * ## Known gap
 * The RESOLVED layout is not published to the DOM - neither `Layout.vue` nor
 * any of the eight `layouts/*.layout.vue` roots carries a test hook - so
 * "template X renders layout Y" cannot be asserted from here. Publishing the
 * variant on `layout/components/root/Root.vue` would close it; that is an app
 * change, not a test one.
 */

// The area template enums (`SESSION_TEMPLATE`, `PRODUCT_TEMPLATE`,
// `BASKET_TEMPLATE`, `CHECKOUT_TEMPLATE`) minus `inset` - that is the one-page
// variant, a different journey owned by `one-page-checkout.spec.ts` and
// `checkout-flow-selection.spec.ts`.
const AUTH_TEMPLATES = [
  "split",
  "enclosed",
  "canvas-card",
  "surface-box",
  "two-column-ltr",
  "two-column-rtl"
] as const;

const ORDER_TEMPLATES = [
  "full",
  "enclosed",
  "two-column-ltr",
  "two-column-rtl"
] as const;

/** No area's enum carries this, so it must resolve to the area's default. */
const UNSUPPORTED_TEMPLATE = "no-such-template";

// -----------------------------------------------------------------------------

test.describe("Brand Settings - UI Templates", () => {
  test.afterEach(async ({ page, context }) => {
    await page.unrouteAll({ behavior: "wait" });
    await context.unrouteAll({ behavior: "wait" });
  });

  test.describe("Login UI Templates", () => {
    for (const template of [...AUTH_TEMPLATES, UNSUPPORTED_TEMPLATE]) {
      test(`Login renders under the ${template} template`, async ({
        page,
        context
      }) => {
        const login = new Login(page);
        interceptUISchema(context, { "@context.auth.template": template });
        await page.goto(URLs.login);
        await waitForSessionCookie(context);
        await expect(login.loginForm).toBeVisible({ timeout: 15000 });
      });
    }
    test("Login renders with no template set (the area default)", async ({
      page,
      context
    }) => {
      const login = new Login(page);
      await page.goto(URLs.login);
      await waitForSessionCookie(context);
      await expect(login.loginForm).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Register UI Templates", () => {
    for (const template of [...AUTH_TEMPLATES, UNSUPPORTED_TEMPLATE]) {
      test(`Registration renders under the ${template} template`, async ({
        page,
        context
      }) => {
        const register = new Registration(page, context);
        interceptUISchema(context, { "@context.auth.template": template });
        await page.goto(URLs.register);
        await waitForSessionCookie(context);
        await expect(register.registrationForm).toBeVisible({ timeout: 15000 });
      });
    }
    test("Registration renders with no template set (the area default)", async ({
      page,
      context
    }) => {
      const register = new Registration(page, context);
      await page.goto(URLs.register);
      await waitForSessionCookie(context);
      await expect(register.registrationForm).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Product Config UI Templates", () => {
    for (const template of [...ORDER_TEMPLATES, UNSUPPORTED_TEMPLATE]) {
      test(`Product config renders under the ${template} template`, async ({
        page,
        context
      }) => {
        const productConfig = new ProductConfig(page);
        interceptUISchema(context, { "@context.configure.template": template });
        await page.goto(URLs.starterHosting);
        await waitForSessionCookie(context);
        await expect(productConfig.productConfigSection).toBeVisible({
          timeout: 15000
        });
      });
    }
    test("Product config renders with no template set (the area default)", async ({
      page,
      context
    }) => {
      const productConfig = new ProductConfig(page);
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(context);
      await expect(productConfig.productConfigSection).toBeVisible({
        timeout: 15000
      });
    });
  });

  // Basket and checkout need a customer with a seeded basket, and they share ONE
  // staging account, so they take turns: under fullyParallel a sibling would
  // flip that account's current order mid-test (the same reason
  // `template-matrix.spec.ts` runs serially).
  test.describe("Basket and Checkout UI Templates", () => {
    test.describe.configure({ mode: "serial" });

    async function seedCustomerBasket(page: Page) {
      await page.goto(URLs.login);
      await loginViaHeadless(
        page,
        Logins.uiTesting.username,
        Logins.uiTesting.password
      );
      await page.reload();
      await addProductViaHeadless(page, {
        productId: products.STARTER_HOSTING.id,
        quantity: 1,
        billingCycleMonths: products.STARTER_HOSTING.billingCycle,
        // A fresh 10-letter label each seed: staging's registrar refuses a
        // domain it already holds ("Failed to validate pending products"), and
        // a short alphanumeric one intermittently (see flows/product-setup.ts).
        provisionFields: {
          domain: `${fakerEN_GB.string.alpha({
            length: 10,
            casing: "lower"
          })}.com`
        }
      });
    }

    for (const template of [...ORDER_TEMPLATES, UNSUPPORTED_TEMPLATE]) {
      test(`Basket renders under the ${template} template`, async ({
        page,
        context
      }) => {
        await seedCustomerBasket(page);
        interceptUISchema(context, { "@context.basket.template": template });
        await page.goto(URLs.basket);
        await waitForSessionCookie(context);
        await expect(page.getByTestId("basket-product").first()).toBeVisible({
          timeout: 15000
        });
      });
    }

    for (const template of [...ORDER_TEMPLATES, UNSUPPORTED_TEMPLATE]) {
      test(`Checkout renders under the ${template} template`, async ({
        page,
        context
      }) => {
        const checkout = new Checkout(page);
        await seedCustomerBasket(page);
        interceptUISchema(context, { "@context.checkout.template": template });
        await page.goto(URLs.checkout);
        await waitForSessionCookie(context);
        await expect(checkout.paymentDetails).toBeVisible({ timeout: 30000 });
        await expect(checkout.gateways.first()).toBeVisible({ timeout: 30000 });
      });
    }
  });
});
