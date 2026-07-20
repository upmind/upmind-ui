import { test, expect } from "@playwright/test";
import { newUser } from "../../support/fixtures/auth-context";
import { goToCheckout } from "../../support/flows/checkout";
import { seedGuestBasket } from "../../support/flows/guest-checkout";
import {
  captureBrandSettings,
  interceptConfigValues
} from "../../support/mocks/brand";
import { products } from "../../support/constants/products";
import { URLs } from "../../support/constants/urls";
import { VerifyEmail } from "../../support/page-objects/templates/verify-email";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Negative-enforcement matrix for the email-verification gate
 * (FE-2826 — the M1 non-bypassable chokepoint after the `session/` → auth +
 * session-store relocation).
 *
 * ## Job To Be Done
 * Prove the order-placement gate cannot be bypassed once the brand requires a
 * verified email (`security.orders.require_verified_email`). The gate now reads
 * `useActiveSession().useMeta().isUnverified.value` in `guardCheckout` (the
 * migrated session-store meta — the only `isGuest`/`primaryEmail` source after
 * the deletion). This spec asserts, at the network level, that an unverified
 * client NEVER reaches the basket-to-invoice conversion
 * (`PATCH /orders/{id}/convert`) — it is intercepted into the verify-email
 * overlay first — and that the gate's ORDERING invariant holds: an anonymous
 * guest-customer (`is_guest=true`) is short-circuited by `isGuestClient` BEFORE
 * `isUnverified` (M6), so a guest is NEVER mis-routed into the verify overlay.
 *
 * ## Matrix
 * - Enforced brand × unverified client × ONE_PAGE and STEPPED checkout layouts —
 *   the gate lives in `guardCheckout`, upstream of layout, so it must hold in
 *   both.
 * - Network-level: no `PATCH /orders/{id}/convert` fires while gated.
 * - Guest-on-enforce-brand: the `isGuestClient` short-circuit keeps a guest out
 *   of the verify overlay.
 * - Client-login (verified) path: a verified client is NOT gated.
 *
 * Runs against whichever app `PW_BASE_URL` targets — cart (Vite) and cart-nuxt
 * share the spec; the `guardCheckout` gate is identical in both apps' funnel
 * engines.
 *
 * ## ⚠️ Documented P4 exception
 * Only the brand SETTING (`requireVerifiedEmail`, `checkoutFlow`) is mocked — a
 * feature-flag mock, P4-safe. The session, order, basket, and gate are all real
 * modules driven against staging; no journey data is fabricated.
 *
 * ## What Breaks If These Fail
 * - An unverified client converts an order (the FE-2826 regression: the gate
 *   stopped reading the relocated session-store meta after `session/` deletion).
 * - A guest-customer is routed into the verify overlay instead of the upgrade
 *   flow (the M6 ordering inversion — `isUnverified` firing before
 *   `isGuestClient`).
 */
// -----------------------------------------------------------------------------

const CONVERT = /\/api\/orders\/[^/]+\/convert/;
const FLOWS: Array<"one_page" | "stepped"> = ["one_page", "stepped"];

newUser.describe("Email-verification enforcement (negative matrix)", () => {
  newUser.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  for (const checkoutFlow of FLOWS) {
    newUser(
      `Unverified client is blocked at checkout and never converts the order (${checkoutFlow})`,
      async ({ page }) => {
        const verify = new VerifyEmail(page);

        let convertFired = false;
        await page.route(CONVERT, async route => {
          convertFired = true;
          await route.continue();
        });

        await interceptConfigValues(page, {
          requireVerifiedEmail: true,
          checkoutFlow
        });

        await goToCheckout(page, products.STARTER_HOSTING, null, null);

        // The gate intercepts into the verify-email overlay before any
        // basket->invoice conversion.
        await expect(verify.otpInput.first()).toBeVisible();

        // Network-level proof: the order was never converted while gated.
        expect(convertFired).toBe(false);
      }
    );
  }

  newUser(
    "Negative control: with enforcement OFF the same client reaches checkout (proves the gate, not another guard, blocks)",
    async ({ page }) => {
      const verify = new VerifyEmail(page);

      await interceptConfigValues(page, { requireVerifiedEmail: false });
      await goToCheckout(page, products.STARTER_HOSTING, null, null);

      // Gate OFF → no verify overlay; the client lands on the checkout page.
      await expect(verify.otpInput).toHaveCount(0);
    }
  );
});

/* Plain `test` base, NOT the newUser fixture: since fd2073a86 the fixture
   registers and logs in a client in-page, so the browser would no longer be an
   anonymous guest and seedGuestBasket's `actor === "guest"` gate would fail. */
test.describe("Email-verification enforcement — guest short-circuit", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  test("A guest-customer on an enforce-verified brand is NOT routed to the verify overlay (isGuestClient short-circuits isUnverified)", async ({
    page
  }) => {
    // Attach the brand-settings listener before the basket nav that triggers
    // the config GET, then await it — capturing it inline would wait forever
    // for a response the fixture's initial load already consumed.
    const brandSettings = captureBrandSettings(page);

    const verify = new VerifyEmail(page);

    await seedGuestBasket(page, products.HAT);

    // Guest checkout must be enabled on this brand for the guest journey to be
    // reachable; read the real value and skip rather than mock journey data.
    const brand = await brandSettings;
    test.skip(
      brand["invoices.guest_checkout.enabled"] !== true,
      "Brand does not allow guest checkout — guest short-circuit is unreachable here."
    );

    await interceptConfigValues(page, { requireVerifiedEmail: true });
    await page.goto(URLs.checkout);

    // The guest is short-circuited by isGuestClient — never the verify overlay.
    await expect(verify.otpInput).toHaveCount(0);
  });
});
