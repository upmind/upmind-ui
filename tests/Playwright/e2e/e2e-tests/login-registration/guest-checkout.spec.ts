import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { seedGuestBasket } from "../../support/flows/guest-checkout";
import {
  captureBrandSettings,
  interceptConfigValues
} from "../../support/mocks/brand";
import { GuestCheckout } from "../../support/page-objects/templates/guest-checkout";
import { Registration } from "../../support/page-objects/templates/registration";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Guest checkout (FE-1035) e2e coverage.
 *
 * ## Job To Be Done
 * Prove the guest-checkout journey from the register page works end-to-end
 * against the real headless/client-vue modules: a brand-gated CTA lets a guest
 * visitor skip account creation, enter checkout as a guest client whose account
 * menu identifies them as a guest and offers a full-account upgrade — and that
 * upgrade promotes the guest to a fully registered client. When the brand
 * disallows guest checkout, no guest CTA is offered at all.
 *
 * Implements `tests/features/login-registration/guest-checkout.feature`
 * (one test per Scenario).
 *
 * ## Gate dependency
 * The CTA-visibility scenarios mock the brand config (`interceptConfigValues`)
 * because they assert the FE gate alone. The journey scenarios (enter guest
 * checkout, upgrade) cannot be mocked: `register/guest` and
 * `complete_registration` are enforced server-side, so they need the gate
 * really enabled on the target brand. They read the REAL flag with
 * `captureBrandSettings` and `test.skip` when it's off — so they run on a
 * guest-checkout-enabled brand and skip (rather than fail) on one where it's
 * disabled. See `support/mocks/brand.ts`.
 *
 * ## What Breaks If These Fail
 * - The guest CTA stops appearing (or appears on a brand that disabled it),
 *   so visitors either can't reach guest checkout or are offered an unsupported
 *   path that the backend rejects.
 * - The CTA appears for subscription baskets (recurring products require a
 *   full account — `basketMeta.hasRecurringProducts` gates it since
 *   fc0494b9b), offering guests a checkout path that can't complete.
 * - Entering guest checkout no longer signs the visitor in as a guest client,
 *   breaking the whole skip-registration flow.
 * - The account menu mislabels a guest, or stops offering the upgrade, stranding
 *   guests with no route to a full account.
 * - The upgrade form fails to promote a guest to a full client, so guests can
 *   never convert post-purchase.
 */

// Brand-config key behind the guest-checkout gate
// (`BrandConfigKeys.GUEST_CHECKOUT_ENABLED`).
const GUEST_CHECKOUT_KEY = "invoices.guest_checkout.enabled";

test.describe("Guest checkout", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  // Scenario: The guest checkout option is offered when the brand allows guest checkout
  test("The guest checkout option is offered when the brand allows guest checkout", async ({
    page,
    context
  }) => {
    const guest = new GuestCheckout(page);

    // Given the brand allows guest checkout — mock the gate ON (a settings mock).
    await interceptConfigValues(page, { guestCheckoutEnabled: true });

    // Given a guest visitor with a product in their basket
    await seedGuestBasket(page);

    // When the visitor opens the register page
    await page.goto(URLs.register);
    // control-flow guard — register form rendered
    await expect(
      page
        .getByTestId("section")
        .and(page.locator(`[data-test-value="register"]`))
    ).toBeVisible();

    // Then the guest checkout option is offered
    await expect(guest.cta).toBeVisible();
  });

  // Scenario: The guest checkout option is hidden when the brand disallows guest checkout
  test("The guest checkout option is hidden when the brand disallows guest checkout", async ({
    page,
    context
  }) => {
    const guest = new GuestCheckout(page);

    // Given the brand does not allow guest checkout — mock the gate OFF (a
    // settings mock, not journey data) BEFORE any navigation.
    await interceptConfigValues(page, { guestCheckoutEnabled: false });

    // Given a guest visitor with a product in their basket
    await seedGuestBasket(page);

    // When the visitor opens the register page
    await page.goto(URLs.register);
    // control-flow guard — register form rendered before asserting CTA absence
    await expect(
      page
        .getByTestId("section")
        .and(page.locator(`[data-test-value="register"]`))
    ).toBeVisible();

    // Then no guest checkout option is offered
    await expect(guest.cta).toHaveCount(0);
  });

  // Scenario: The guest checkout option is not offered for subscription products
  test("The guest checkout option is not offered for subscription products", async ({
    page,
    context
  }) => {
    const guest = new GuestCheckout(page);

    // Given the brand allows guest checkout — mock the gate ON; the hidden CTA
    // must be attributable to the basket contents, not the brand flag.
    await interceptConfigValues(page, { guestCheckoutEnabled: true });

    // But the visitor's basket contains a subscription product
    await seedGuestBasket(page, products.STARTER_HOSTING);

    // When the visitor opens the register page
    await page.goto(URLs.register);
    // control-flow guard — register form rendered before asserting CTA absence
    await expect(
      page
        .getByTestId("section")
        .and(page.locator(`[data-test-value="register"]`))
    ).toBeVisible();

    // Then no guest checkout option is offered (recurring products require a
    // full account — `basketMeta.hasRecurringProducts` gates the CTA)
    await expect(guest.cta).toHaveCount(0);
  });

  // Scenario: Entering guest checkout signs the visitor in as a guest client
  test("Entering guest checkout signs the visitor in as a guest client", async ({
    page,
    context
  }) => {
    const guest = new GuestCheckout(page);

    // Given a guest visitor with a product in their basket
    await seedGuestBasket(page);

    // Given the brand allows guest checkout — read the REAL flag (no mock; the
    // register/guest call is server-enforced) and skip where it's off.
    const settings = captureBrandSettings(page);
    await page.goto(URLs.register);
    const config = await settings;
    test.skip(
      !config[GUEST_CHECKOUT_KEY],
      `Guest checkout disabled on this brand (${URLs.baseUrl}) — run against a guest-checkout-enabled brand`
    );

    // And the visitor is on the register page
    await expect(guest.cta).toBeVisible();

    // When they choose to check out as a guest (this registers a guest client
    // and moves into the checkout funnel).
    await guest.enterGuestCheckout();

    // A guest client holds a client session — wait for it as the deterministic
    // "signed in as a guest client" signal before asserting the UI.
    await expect
      .poll(
        async () =>
          (await context.cookies()).some(c => c.name === "upm_client_session"),
        { timeout: 20000 }
      )
      .toBeTruthy();

    // control-flow guard — the account menu lives in the storefront header.
    // Assert it from the catalogue, a basket-independent storefront page.
    // (Entering guest checkout otherwise lands on the basket, and an empty
    // basket renders as a backdrop dialog that overlays the header avatar; the
    // auth pages like /register don't render the storefront header at all.)
    await page.goto(`${URLs.baseUrl}order/shop/`);

    // Then their account menu identifies them as a guest — the avatar (only
    // shown once a client session exists) appears, and the dropdown's guest
    // label is present.
    await expect(guest.avatar).toBeVisible({ timeout: 15000 });
    await guest.openAccountMenu();
    await expect(guest.accountLabel).toBeVisible();

    // And the account menu offers a full-account upgrade (this item is rendered
    // only for a guest client — its presence is the guest-state signal).
    await expect(guest.upgradeMenuItem).toBeVisible();
  });

  // Scenario: A guest upgrades to a full account from the register page
  test("A guest upgrades to a full account from the register page", async ({
    page,
    context
  }) => {
    const guest = new GuestCheckout(page);
    const registration = new Registration(page, context);

    // Given a guest visitor with a product in their basket
    await seedGuestBasket(page);

    // Given the brand allows guest checkout — read the REAL flag and skip where
    // off (complete_registration is server-enforced).
    const settings = captureBrandSettings(page);
    await page.goto(URLs.register);
    const config = await settings;
    test.skip(
      !config[GUEST_CHECKOUT_KEY],
      `Guest checkout disabled on this brand (${URLs.baseUrl}) — run against a guest-checkout-enabled brand`
    );

    // And the visitor has entered guest checkout (becomes a guest client and
    // moves into the funnel — the upgrade form is NOT on this CTA).
    await expect(guest.cta).toBeVisible();
    await guest.enterGuestCheckout();
    await expect
      .poll(
        async () =>
          (await context.cookies()).some(c => c.name === "upm_client_session"),
        { timeout: 20000 }
      )
      .toBeTruthy();

    // And the visitor is on the register page — a guest client visiting
    // /register is served the shared Auth upgrade form (`guest-register-form`).
    await page.goto(URLs.register);
    await expect(guest.upgradeForm).toBeVisible({ timeout: 15000 });

    // When they complete the registration form with valid details
    const upgradeEmail = `nathan.robinson+${Date.now()}@upmind.com`;
    await registration.firstName.fill("Nathan");
    await registration.lastName.fill("Robinson");
    await registration.email.fill(upgradeEmail);
    await registration.password.fill("Password1!");
    // Assert the submitted details reach the wire (FE-2985 mutation-chain rule):
    // the upgrade POSTs /clients/{id}/complete_registration (headless
    // account.services), and its payload must carry the entered name and email —
    // the cookie/unmount checks below only prove the guest state flipped, not
    // that these fields were what promoted the account.
    const upgradeRequest = page.waitForRequest(
      r =>
        r.method() === "POST" &&
        /\/clients\/[^/]+\/complete_registration/.test(r.url())
    );
    await guest.upgradeFormSubmit.click();
    const upgradePayload = JSON.stringify(
      (await upgradeRequest).postDataJSON()
    );
    expect(upgradePayload).toContain(upgradeEmail);
    expect(upgradePayload).toContain("Nathan");

    // Then they become a fully registered client and the guest upgrade prompt
    // is no longer shown. A guest client already holds `upm_client_session`, so
    // the cookie can't prove the upgrade — instead assert the guest-only state
    // is gone: the upgrade form unmounts because `isGuestClient` flips to false
    // (a failed registration would keep the form, showing an inline error).
    await expect(guest.upgradeForm).toHaveCount(0, { timeout: 30000 });
  });
});
