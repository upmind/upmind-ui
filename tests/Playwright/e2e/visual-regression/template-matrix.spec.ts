import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { Logins } from "../support/constants/logins";
import { products } from "../support/constants/products";
import { Login } from "../support/page-objects/templates/login";
import { Registration } from "../support/page-objects/templates/registration";
import { ProductConfig } from "../support/page-objects/templates/product-config";
import { Checkout } from "../support/page-objects/templates/checkout";
import { loginViaHeadless } from "../support/flows/auth-setup";
import { addProductViaHeadless } from "../support/flows/basket-setup";
import { interceptUISchema } from "../support/mocks/brand";
import { waitForSessionCookie } from "../support/helpers/session";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Brand UI Template × Page Layout Matrix Visual Regression Tests
 *
 * ## Job To Be Done
 * A brand can drive the layout of each cart screen by setting a `template`
 * value in its UISchema (`@context.<area>.template`). This suite captures one
 * page-load baseline per (page × template) so a CSS/template regression in any
 * single layout variant is caught before ship. It complements the functional
 * `brand-settings/ui-templates.spec.ts` (which asserts the layout switches at
 * all) by pinning the pixels of each variant.
 *
 * ## What Breaks If These Fail
 * - A template-layout regression silently ships a broken layout for one brand
 *   configuration (e.g. the split/canvas-card auth layout, or an enclosed
 *   checkout) while the default two-column layout still looks fine.
 *
 * ## Scope (bounded)
 * One page-load screenshot per (page × template) — no deep interaction.
 * English-only: these are pure-layout variants, so the English baseline is
 * sufficient per the FE-2861 acceptance criteria; the matrix is deliberately
 * NOT looped across all 28 locales.
 *
 * ## Template values that actually exist
 * The template enum differs by module (verified in packages/client-vue/src):
 * - auth pages (session module): split, enclosed, canvas-card, surface-box,
 *   two-column-ltr, two-column-rtl. `full` is accepted by the UISchema and the
 *   functional spec baselines it (register-full.png) — included here for parity.
 * - configure / basket / checkout modules: full, enclosed, two-column-ltr,
 *   two-column-rtl ONLY. `split`, `canvas-card` and `surface-box` are NOT in
 *   PRODUCT_TEMPLATE / BASKET_TEMPLATE / CHECKOUT_TEMPLATE, so they are skipped
 *   for those pages (see blockers) rather than invented.
 */

const AUTH_TEMPLATES = [
  "split",
  "enclosed",
  "canvas-card",
  "surface-box",
  "two-column-ltr",
  "two-column-rtl",
  "full"
] as const;

const ORDER_TEMPLATES = [
  "full",
  "enclosed",
  "two-column-ltr",
  "two-column-rtl"
] as const;

// Dynamic / animated / 3rd-party surfaces masked out of every capture so the
// baseline is deterministic across runs (dates/prices in <dt>, animated icons,
// the Stripe card iframe on checkout).
function masks(page: Page): Locator[] {
  return [
    page.locator("dt"),
    page.locator("lord-icon"),
    page.locator('iframe[title="Secure payment input frame"]')
  ];
}

const disableAnimations = `
  *,
  *::before,
  *::after {
    transition: none !important;
    animation: none !important;
    caret-color: transparent !important;
  }
`;

// -----------------------------------------------------------------------------

test.describe("Template Matrix Visual Regression @template-matrix", () => {
  // The checkout tests authenticate the SHARED Logins.uiTesting account and each
  // seed its basket; serial makes the (single-locale) matrix take turns so a
  // sibling can't flip that account's current order under fullyParallel
  // (mirrors checkout.spec.ts). Scope to a checkout-only sub-describe if the
  // matrix's wall-clock later matters more than the belt-and-braces.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ content: disableAnimations });
  });

  test.afterEach(async ({ page, context }) => {
    await page.unrouteAll({ behavior: "wait" });
    await context.unrouteAll({ behavior: "wait" });
  });

  // --- login (auth) -----------------------------------------------------------
  for (const template of AUTH_TEMPLATES) {
    test(`Login — ${template}`, async ({ page, context }) => {
      const login = new Login(page);
      interceptUISchema(context, { "@context.auth.template": template });
      await page.goto(URLs.login);
      await waitForSessionCookie(context);
      await expect(login.loginForm).toBeVisible({ timeout: 15000 });
      await expect(page).toHaveScreenshot(`template-login-${template}`, {
        fullPage: true,
        mask: masks(page)
      });
    });
  }

  // --- registration (auth) -----------------------------------------------------
  for (const template of AUTH_TEMPLATES) {
    test(`Registration — ${template}`, async ({ page, context }) => {
      const registration = new Registration(page, context);
      interceptUISchema(context, { "@context.auth.template": template });
      await page.goto(URLs.register);
      await waitForSessionCookie(context);
      await expect(registration.registrationForm).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`template-registration-${template}`, {
        fullPage: true,
        mask: masks(page)
      });
    });
  }

  // --- product-config (configure) — guest -------------------------------------
  for (const template of ORDER_TEMPLATES) {
    test(`Product Config — ${template}`, async ({ page, context }) => {
      const productConfig = new ProductConfig(page);
      interceptUISchema(context, { "@context.configure.template": template });
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(context);
      await expect(productConfig.productConfigSection).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(
        `template-product-config-${template}`,
        { fullPage: true, mask: masks(page) }
      );
    });
  }

  // --- basket (Logins.uiTesting) ----------------------------------------------
  for (const template of ORDER_TEMPLATES) {
    test(`Basket — ${template}`, async ({ page, context }) => {
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
        provisionFields: { domain: "uitesting.com" }
      });
      interceptUISchema(context, { "@context.basket.template": template });
      await page.goto(URLs.basket);
      await waitForSessionCookie(context);
      await expect(page.getByTestId("basket-product").first()).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`template-basket-${template}`, {
        fullPage: true,
        mask: masks(page)
      });
    });
  }

  // --- checkout (Logins.uiTesting) --------------------------------------------
  for (const template of ORDER_TEMPLATES) {
    test(`Checkout — ${template}`, async ({ page, context }) => {
      const checkout = new Checkout(page);
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
        provisionFields: { domain: "uitesting.com" }
      });
      interceptUISchema(context, { "@context.checkout.template": template });
      await page.goto(URLs.checkout);
      await waitForSessionCookie(context);
      await expect(checkout.paymentDetails).toBeVisible({ timeout: 30000 });
      await expect(checkout.gateways.first()).toBeVisible({ timeout: 30000 });
      await expect(page).toHaveScreenshot(`template-checkout-${template}`, {
        fullPage: true,
        mask: masks(page)
      });
    });
  }
});
