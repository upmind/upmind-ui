import { test, expect } from "@playwright/test";
import { newUser } from "../../support/fixtures/auth-context";
import { AuthOverlay } from "../../support/page-objects/templates/auth-overlay";
import { Login } from "../../support/page-objects/templates/login";
import { VerifyEmail } from "../../support/page-objects/templates/verify-email";
import { URLs } from "../../support/constants/urls";
import { Logins } from "../../support/constants/logins";
import { products } from "../../support/constants/products";
import { goToCheckout } from "../../support/flows/checkout";
import { addProductViaHeadless } from "../../support/flows/basket-setup";
import { interceptConfigValues } from "../../support/mocks/brand";

// -----------------------------------------------------------------------------
/**
 * Job To Be Done (FE-2790 / FE-1365)
 * ----------------------------------
 * `auth-route.spec.ts` proves the way INTO the auth overlay (open it, sign in)
 * but never the way OUT — the FE-1365 concern is that the overlay must close and
 * restore the page underneath. This spec covers the exit paths the shipped cart
 * actually exposes on the deep-linkable overlay routes:
 *
 *   1. Browser-back closes the overlay and restores the underlying route (the
 *      canonical "auth-overlay browser-back" check named in FE-2787).
 *   2. Signing in resolves the overlay and hands the visitor to the return
 *      target carried in the URL (the `handleClose → close() → returnUrl` exit).
 *   3. The overlay renders on a cold, deep-linked load (the cart-nuxt
 *      post-hydration smoke — the same spec runs against whichever app
 *      `PW_BASE_URL` targets).
 *   4. The funnel guard on a bid-scoped basket route sends a signed-out visitor
 *      to the auth OVERLAY (not the full-page register) with the bid preserved,
 *      and signing in returns them to that same basket (the `guardBasket` →
 *      `basket--auth` → `returnUrl` round-trip, BID intact).
 *   5. The email-verification overlay is `dismissable: false`, so it cannot be
 *      escaped with Escape/backdrop.
 *
 * Assertions on "closed"/"open" read the overlay's presence (behavioural). The
 * "restored/return" assertions name the destination URL: per FE-2782 that is a
 * documented Category-3 URL assertion — the route IS the contract of an overlay
 * whose whole job is to layer over, and restore, a specific page.
 *
 * ## Scope notes (verified against staging while authoring — see FE-2790 report)
 * - The auth overlay is rendered `dismissable="false"` by `OverlayController`
 *   (no `dismissable` in its route meta), so Escape/backdrop do NOT trigger
 *   `useOverlayRoute.dismiss()` on it; its exits are browser-back, the in-form
 *   cancel control (→ basket), and sign-in success. The `dismiss()` no-history
 *   push-to-parent fallback is therefore not reachable via the auth overlay's
 *   own UI and is not asserted here.
 * - The funnel→auth-OVERLAY redirect fires on the bid-scoped basket guard: a
 *   signed-out visitor opening `/order/basket/{bid}/` is handed to `basket--auth`
 *   with the bid preserved in the overlay path and carried back as the return
 *   target. That path is covered below by provisioning a REAL guest basket via
 *   the live headless system (`addProductViaHeadless` returns the server bid) —
 *   no fabricated id. The one variant left out is the guest-checkout-DISABLED
 *   brand, which routes the same visitor to the full-page register rather than
 *   the overlay; that is a brand-config branch, not the overlay contract.
 * - Route/container internals (`registerOverlayRoutes` injection, Dialog/Drawer
 *   resolution, the `useOverlayRoute` computed derivation) stay at unit.
 */
// -----------------------------------------------------------------------------

/** The auth overlay layered over the product page (its deep-link parent). */
const PRODUCT_AUTH_OVERLAY = `${URLs.starterHosting}auth/`;

test.describe("Auth overlay exit paths", () => {
  test("Going back closes an auth overlay and returns to the underlying page", async ({
    page
  }) => {
    const overlay = new AuthOverlay(page);

    // Given — a visitor on a product page who then opens the sign-in overlay
    // over it. Two real navigations, so the browser history has the product
    // page behind the overlay.
    await page.goto(URLs.starterHosting);
    await page.goto(PRODUCT_AUTH_OVERLAY);
    await overlay.expectOpen(); // control-flow guard: overlay up before we exit

    // When — they go back.
    await page.goBack();

    // Then — the sign-in overlay is no longer shown.
    await overlay.expectClosed();
    // And — they are returned to the product page (route restored; FE-2782 C3).
    await expect(page).not.toHaveURL(/\/auth\//);
    await expect(page).toHaveURL(/\/order\/product\//);
  });

  test("Signing in from the auth overlay returns the visitor to the return target", async ({
    page
  }) => {
    const overlay = new AuthOverlay(page);
    const login = new Login(page);

    // Given — a visitor at the sign-in overlay opened with a return target in
    // the URL, exactly as the funnel opens it when it sends someone to sign in.
    // The return target is the basket route the overlay should hand them to
    // once auth resolves (`close()` → `router.replace(returnUrl)`).
    await page.goto(
      `${PRODUCT_AUTH_OVERLAY}?mode=login&returnUrl=${encodeURIComponent("/order/basket/")}`
    );
    await overlay.expectOpen(); // control-flow guard: at the sign-in gate

    // When — they sign in with valid credentials. The overlay hosts the same
    // login form as the standalone /auth page, driven via the Login PO.
    await login.inputLogin(
      Logins.checkoutUser.username,
      Logins.checkoutUser.password
    );

    // Then — the sign-in overlay is no longer shown (auth resolved → close()).
    await overlay.expectClosed();
    // And — they are handed to the return target carried in the URL, not left
    // on the auth route (the returnUrl round-trip; FE-2782 C3).
    await expect(page).not.toHaveURL(/\/auth\//);
    await expect(page).toHaveURL(/\/order\/basket\//);
  });

  test("The sign-in overlay renders when it is opened directly", async ({
    page
  }) => {
    const overlay = new AuthOverlay(page);

    // Given — a visitor who arrives directly at the sign-in overlay.
    // When — the page has finished loading (cold, deep-linked).
    // This is the cart-nuxt post-hydration smoke: the same spec runs against
    // whichever app `PW_BASE_URL` targets (cart Vite SPA + cart-nuxt SSR).
    await page.goto(PRODUCT_AUTH_OVERLAY);

    // Then — the sign-in overlay is shown (the modal mounted over the page).
    await overlay.expectOpen();
  });
});

test.describe("Auth overlay funnel-guard redirect", () => {
  test("Opening a saved basket while signed out lands on the sign-in overlay with the bid preserved, then returns to the basket after signing in", async ({
    page
  }) => {
    const overlay = new AuthOverlay(page);
    const login = new Login(page);

    // Given — a signed-out visitor with a real basket. Driving the live headless
    // system provisions a genuine server basket and hands back its id, so the
    // guard is exercised against a real bid — not a fabricated one.
    await page.goto(URLs.starterHosting);
    const { basketId } = await addProductViaHeadless(page, {
      productId: products.STARTER_HOSTING.id,
      billingCycleMonths: products.STARTER_HOSTING.billingCycle
    });

    // When — they open that bid-scoped basket route while still signed out.
    // `guardBasket` gates ANY bid-scoped basket on authentication, so it hands
    // an unauthenticated visitor to the sign-in overlay layered on that same
    // route (`basket--auth`), carrying the basket route as the return target.
    await page.goto(`${URLs.basket}${basketId}/`);

    // Then — the sign-in overlay is shown (the MODAL — not the full-page
    // register a guest-checkout-disabled brand would send them to).
    await overlay.expectOpen();
    // And — the bid is preserved: it stays in the overlay's own path, so the
    // gate is scoped to the requested basket (FE-2782 C3 — the route is the
    // contract of an overlay whose job is to restore the requested basket). The
    // guard keeps the return target in the funnel's machine context rather than
    // a visible `?returnUrl=`, so we prove its preservation behaviourally, by
    // the round-trip below, not by coupling to that query param.
    await expect(page).toHaveURL(new RegExp(`/order/basket/${basketId}/auth/`));

    // When — they sign in with valid credentials (the overlay hosts the same
    // login form as the standalone /auth page, driven via the Login PO).
    await login.inputLogin(
      Logins.checkoutUser.username,
      Logins.checkoutUser.password
    );

    // Then — the sign-in overlay is gone (auth resolved → close() → return).
    await overlay.expectClosed();
    // And — they are handed back to the requested basket, bid intact — the
    // return target survived the sign-in (the "returnUrl preserved" AC, proven
    // by where they land rather than by the query mechanism that carries it).
    await expect(page).not.toHaveURL(/\/auth\//);
    await expect(page).toHaveURL(new RegExp(`/order/basket/${basketId}/`));
  });
});

newUser.describe("Auth overlay non-dismissable gate", () => {
  newUser.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  newUser(
    "The email-verification overlay cannot be dismissed",
    async ({ page }) => {
      const verify = new VerifyEmail(page);

      // Given — a fresh (unverified) customer who must verify their email before
      // checking out. Only the brand's require-verified-email flag is mocked
      // (P4-safe); the verification gate itself is the real `guardCheckout`.
      await interceptConfigValues(page, { requireVerifiedEmail: true });

      // And — they are shown the email-verification overlay (the gate routes the
      // unverified client into it on the way to checkout).
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await expect(page).toHaveURL(/\/order\/checkout\/verify-email\//);
      await expect(verify.otpInput.first()).toBeVisible(); // control-flow guard

      // When — they attempt to dismiss it. This overlay is registered
      // `OverlayType.CUSTOM`, which `OverlayController` renders through a bare
      // `Slot` (no dialog chrome) — so, unlike the MODAL auth overlay, there is
      // no backdrop element to click. Escape is therefore the only generic
      // dismiss gesture a visitor can attempt, and `dismissable: false` means it
      // is a no-op — it stands in for the whole "try to escape" class here.
      await page.keyboard.press("Escape");

      // Then — the email-verification overlay remains open: the gate cannot be
      // escaped.
      await expect(verify.otpInput.first()).toBeVisible();
      await expect(page).toHaveURL(/\/order\/checkout\/verify-email\//);
    }
  );
});
