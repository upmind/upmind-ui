import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { Checkout } from "../support/page-objects/templates/checkout";
import { GuestCheckout } from "../support/page-objects/templates/guest-checkout";
import { loginViaHeadless } from "../support/flows/auth-setup";
import { Logins } from "../support/constants/logins";
import { goToCheckout } from "../support/flows/checkout";
import { seedGuestBasket } from "../support/flows/guest-checkout";
import { products } from "../support/constants/products";
import { gateways } from "../support/constants/gateways";
import { waitForSessionCookie } from "../support/helpers/session";
import { setLocale } from "../support/helpers/locale";
import {
  captureBrandSettings,
  interceptConfigValues
} from "../support/mocks/brand";
import { mockWalletBalance } from "../support/mocks";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Checkout Visual Regression Tests
 *
 * ## Job To Be Done
 * Protect the checkout screen's rendered layout across the 28-locale i18n matrix
 * for the states a shopper actually sees: a registered user's checkout, a guest
 * checkout, and the three payment-method-selected states (Stripe card gateway,
 * Pay Later, account credit applied). Each baseline catches per-locale layout
 * breakage — text overflow, RTL (Urdu), long German strings, truncated labels —
 * that a functional spec cannot see.
 *
 * ## What Breaks If These Fail
 * - A CSS/template regression silently ships a broken checkout layout in one or
 *   more locales (overflowing billing labels, clipped gateway cards, misaligned
 *   account-credit row).
 * - A gateway-selection regression renders the wrong payment surface.
 *
 * ## Determinism & locale strategy
 * The "Registered User" test authenticates a per-locale staging account
 * (`Logins[key]`) whose own locale preference renders the page, so it does not
 * call `setLocale`. The guest and payment-state tests have no per-locale account
 * (guest checkout mints a fresh anonymous session; the payment-state tests share
 * the per-locale account but must pin the locale explicitly), so each carries an
 * explicit BCP-47 `locale` and calls `setLocale` after navigation — mirroring
 * the basket/registration vis-reg specs.
 *
 * The guest test cannot mock its way past `register/guest` (server-enforced), so
 * it reads the REAL brand flag with `captureBrandSettings` + `test.skip` exactly
 * like the functional journey scenarios, and additionally mocks the gate ON so
 * the CTA renders. seedGuestBasket / goToCheckout drive REAL modules — no
 * hand-rolled session, no hardcoded order UUIDs.
 */

// Brand-config key behind the guest-checkout gate
// (`BrandConfigKeys.GUEST_CHECKOUT_ENABLED`).
const GUEST_CHECKOUT_KEY = "invoices.guest_checkout.enabled";

let checkout: Checkout;

// Each entry pairs a `Logins` account key (authenticated by the Registered User
// test) with the BCP-47 locale that the guest / payment-state tests pin via
// `setLocale`. Order mirrors the `Languages` constant the sibling vis-reg specs
// loop, so all checkout baselines screenshot the same locale set.
const localeLoginsConfig: {
  key: keyof typeof Logins;
  locale: string;
}[] = [
  { key: "english", locale: "en" },
  { key: "englishUS", locale: "en-US" },
  { key: "french", locale: "fr" },
  { key: "german", locale: "de" },
  { key: "greek", locale: "el" },
  { key: "danish", locale: "da" },
  { key: "polish", locale: "pl" },
  { key: "spanish", locale: "es" },
  { key: "portuguese", locale: "pt" },
  { key: "bulgarian", locale: "bg" },
  { key: "azerbaijani", locale: "az" },
  { key: "dutch", locale: "nl" },
  { key: "indonesian", locale: "id" },
  { key: "norwegian", locale: "nb" },
  { key: "turkish", locale: "tr" },
  { key: "ukrainian", locale: "uk" },
  { key: "urdu", locale: "ur" },
  { key: "russian", locale: "ru" },
  { key: "frenchCanada", locale: "fr-CA" },
  { key: "chinese", locale: "zh-TW" },
  { key: "spanishLATAM", locale: "es-419" },
  { key: "romanian", locale: "ro" },
  { key: "czech", locale: "cs" },
  { key: "slovak", locale: "sk" },
  { key: "portugueseBrazil", locale: "pt-BR" },
  { key: "swedish", locale: "sv" },
  { key: "hungarian", locale: "hu" }
];

const localeLogins = localeLoginsConfig.map(({ key, locale }) => ({
  language: key,
  locale,
  ...Logins[key]
}));

for (const { language, locale, username, password } of localeLogins) {
  test.describe(`Checkout Visual Regression Tests - ${language}`, () => {
    // The tests in each locale describe authenticate the SAME per-locale staging
    // account; serial makes them take turns so they can't race that account's
    // order under fullyParallel (mirrors login.spec.ts / guest-account.spec.ts).
    test.describe.configure({ mode: "serial" });

    test.beforeEach(async ({ page }) => {
      checkout = new Checkout(page);
      // Disable all CSS animations and transitions
      await page.goto(URLs.emptyBasket);
      await page.waitForLoadState("load");
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

    test.afterEach(async ({ page, context }) => {
      // Tear down both page- and context-level route mocks (the account-credit
      // test registers wallet routes on the context via mockWalletBalance).
      await page.unrouteAll({ behavior: "wait" });
      await context.unrouteAll({ behavior: "wait" });
    });

    test("Checkout - Guest", async ({ page, context }) => {
      // Mock the guest-checkout gate ON so the CTA renders (a P4-safe settings
      // mock), then read the REAL flag — `register/guest` is server-enforced and
      // cannot be faked, so skip (not fail) on a brand where guest checkout is
      // off, exactly like the functional journey scenarios.
      await interceptConfigValues(page, { guestCheckoutEnabled: true });

      // A guest visitor with a non-recurring product (HAT) in their basket.
      // The guest-checkout option only renders without a recurring product
      // (Register.vue:64 !hasRecurringProducts).
      await seedGuestBasket(page);

      const settings = captureBrandSettings(page);
      await page.goto(URLs.register);
      const config = await settings;
      test.skip(
        !config[GUEST_CHECKOUT_KEY],
        `Guest checkout disabled on this brand (${URLs.baseUrl}) — run against a guest-checkout-enabled brand`
      );

      await setLocale(page, locale);

      const guest = new GuestCheckout(page);
      await expect(guest.cta).toBeVisible();
      await guest.enterGuestCheckout();

      // A guest client holds a client session — the deterministic "signed in as
      // guest" signal before entering the checkout screen.
      await expect
        .poll(
          async () =>
            (await context.cookies()).some(
              c => c.name === "upm_client_session"
            ),
          { timeout: 20000 }
        )
        .toBeTruthy();

      await page.goto(URLs.checkout);
      // Gate on payment-details (the payment-states tests prove this testid
      // renders on the loaded checkout); checkout-content is not on this page.
      await expect(checkout.paymentDetails).toBeVisible({ timeout: 30000 });

      await expect(page).toHaveScreenshot(`${language}/checkout-guest`, {
        fullPage: true,
        mask: [
          page.locator('iframe[title="Secure payment input frame"]'),
          checkout.paymentDetails,
          checkout.basketSummary,
          page.locator("lord-icon")
        ]
      });
    });

    test("Checkout - Registered User", async ({ page }) => {
      await loginViaHeadless(page, username, password);
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await waitForSessionCookie(page.context());
      await expect(checkout.paymentDetails).toBeVisible({ timeout: 30000 });
      await expect(checkout.gateways.first()).toBeVisible({ timeout: 30000 });
      await expect(page).toHaveScreenshot(`${language}/checkout-account-user`, {
        fullPage: true,
        mask: [checkout.basketSummary, page.locator("lord-icon")]
      });
    });

    test("Checkout - Stripe Gateway Selected", async ({ page }) => {
      await loginViaHeadless(page, username, password);
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await waitForSessionCookie(page.context());
      await setLocale(page, locale);

      // Select the Stripe card gateway by its provider-code testid — stable
      // across locales AND gateway order (index 0 is not guaranteed to be
      // Stripe; the label-derived radio-card-* testid is per-locale).
      await checkout.selectGatewayByType(gateways.STRIPE);
      await expect(checkout.paymentDetails).toBeVisible({ timeout: 30000 });

      // Wait for the Stripe card iframe to mount before capturing — never wait
      // on networkidle.
      await expect(
        page.locator('iframe[title="Secure payment input frame"]')
      ).toBeVisible({ timeout: 30000 });

      await expect(page).toHaveScreenshot(
        `${language}/checkout-stripe-selected`,
        {
          fullPage: true,
          mask: [
            page.locator('iframe[title="Secure payment input frame"]'),
            checkout.basketSummary,
            page.locator("lord-icon")
          ]
        }
      );
    });

    test("Checkout - Pay Later Selected", async ({ page }) => {
      await loginViaHeadless(page, username, password);
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await waitForSessionCookie(page.context());
      await setLocale(page, locale);

      // Pay Later carries the stable value="pay-later" attribute — locale-safe.
      await checkout.selectPayLater();
      await expect(checkout.paymentDetails).toBeVisible({ timeout: 30000 });

      await expect(page).toHaveScreenshot(
        `${language}/checkout-pay-later-selected`,
        {
          fullPage: true,
          mask: [checkout.basketSummary, page.locator("lord-icon")]
        }
      );
    });

    test("Checkout - Account Credit Applied", async ({ page, context }) => {
      // Mock wallet balance BEFORE navigation so the GET /api/wallet/balance and
      // POST /api/cart/calculate intercepts are registered when checkout loads.
      // A fixed £100/£100 balance is deterministic (settings-class, P4-allowed).
      mockWalletBalance(context, { ownedAmount: 100, creditAmount: 100 });

      await loginViaHeadless(page, username, password);
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await waitForSessionCookie(page.context());
      await setLocale(page, locale);

      await expect(checkout.accountCredit).toBeVisible({ timeout: 30000 });

      await expect(page).toHaveScreenshot(
        `${language}/checkout-account-credit-applied`,
        {
          fullPage: true,
          mask: [checkout.basketSummary, page.locator("lord-icon")]
        }
      );
    });

    test("Checkout - Voucher Form Expanded", async ({ page }) => {
      await loginViaHeadless(page, username, password);
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await waitForSessionCookie(page.context());
      await setLocale(page, locale);

      // Expand the voucher form via its explicit-testid link, then gate on the
      // revealed promocode form-item before capturing.
      await expect(checkout.addVoucherButton).toBeVisible({ timeout: 30000 });
      await checkout.addVoucherButton.click();
      await expect(checkout.addVoucherForm).toBeVisible({ timeout: 30000 });

      await expect(page).toHaveScreenshot(`${language}/checkout-voucher`, {
        fullPage: true,
        mask: [checkout.basketSummary, page.locator("lord-icon")]
      });
    });

    test("Checkout - Change Amount Dialog", async ({ page }) => {
      await loginViaHeadless(page, username, password);
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await waitForSessionCookie(page.context());
      await setLocale(page, locale);

      // Open the change-amount dialog and gate on the dialog window, its
      // number-field input and the confirm button before entering a value.
      await expect(checkout.changeAmountButton).toBeVisible({ timeout: 30000 });
      await checkout.changeAmountButton.click();
      await expect(checkout.dialogWindow).toBeVisible({ timeout: 30000 });
      await expect(checkout.changeAmountInput).toBeVisible({ timeout: 30000 });
      await expect(checkout.confirmAmountButton).toBeVisible({
        timeout: 30000
      });
      await checkout.changeAmountInput.fill("20");

      await expect(page).toHaveScreenshot(
        `${language}/checkout-change-amount`,
        {
          fullPage: true,
          mask: [checkout.basketSummary, page.locator("lord-icon")]
        }
      );
    });

    test("Checkout - Currency Selector Open", async ({ page }) => {
      await loginViaHeadless(page, username, password);
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await waitForSessionCookie(page.context());
      await setLocale(page, locale);

      // Open the currency dropdown via its explicit trigger testid, then gate on
      // the stable, non-translated AUD option testid (currency-option-{code}).
      const currencyTrigger = page.getByTestId("currency-selector-trigger");
      await expect(currencyTrigger).toBeVisible({ timeout: 30000 });
      await currencyTrigger.click();

      const audOption = page
        .getByTestId("currency-option")
        .and(page.locator('[data-test-value="AUD"]'));
      await expect(audOption).toBeVisible({ timeout: 30000 });

      await expect(page).toHaveScreenshot(`${language}/checkout-currency`, {
        fullPage: true,
        mask: [checkout.basketSummary, page.locator("lord-icon")]
      });
    });
  });
}
