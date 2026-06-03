import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { seedGuestBasket } from "../../support/flows/guest-checkout";
import { interceptConfigValues } from "../../support/mocks/brand";
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
 * Implements `tests/Playwright/features/login-registration/guest-checkout.feature`
 * (one test per Scenario).
 *
 * ## What Breaks If These Fail
 * - The guest CTA stops appearing (or appears on a brand that disabled it),
 *   so visitors either can't reach guest checkout or are offered an unsupported
 *   path that the backend rejects.
 * - Entering guest checkout no longer signs the visitor in as a guest, breaking
 *   the whole skip-registration flow.
 * - The account menu mislabels a guest, or stops offering the upgrade, stranding
 *   guests with no route to a full account.
 * - The upgrade form fails to promote a guest to a full client, so guests can
 *   never convert post-purchase.
 */

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
    await interceptConfigValues(page, null, { guestCheckoutEnabled: true });

    // Given a guest visitor with a product in their basket
    await seedGuestBasket(page, context);

    // When the visitor opens the register page
    await page.goto(URLs.register);
    // control-flow guard — register form rendered
    await expect(page.getByTestId("section-register")).toBeVisible();

    // Then the guest checkout CTA is offered. The journey beyond this (the real
    // register/guest call) is enforced server-side and needs guest checkout
    // enabled on the target brand — see the parked upgrade test.
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
    await interceptConfigValues(page, null, { guestCheckoutEnabled: false });

    // Given a guest visitor with a product in their basket
    await seedGuestBasket(page, context);

    // When the visitor opens the register page
    await page.goto(URLs.register);
    // control-flow guard — register form rendered before asserting CTA absence
    await expect(page.getByTestId("section-register")).toBeVisible();

    // Then no guest checkout option is offered
    await expect(guest.cta).toHaveCount(0);
  });

  // Scenario: A guest upgrades to a full account from the register page
  //
  // Parked: `register/guest` and `complete_registration` are enforced
  // server-side, so this journey needs guest checkout enabled on the target
  // brand (`qa-automation` currently rejects with "Guest checkout is not
  // enabled"). Remove `.fixme` once the flag is toggled on the BE.
  test.fixme("A guest upgrades to a full account from the register page", async ({
    page,
    context
  }) => {
    const guest = new GuestCheckout(page);
    const registration = new Registration(page, context);

    // Given the brand allows guest checkout, and a guest visitor with a basket
    await interceptConfigValues(page, null, { guestCheckoutEnabled: true });
    await seedGuestBasket(page, context);

    // And the visitor has entered guest checkout from the register page
    await page.goto(URLs.register);
    await expect(guest.cta).toBeVisible();
    await guest.enterGuestCheckout();

    // The register page then renders the upgrade form directly (the shared
    // Auth form for a guest client → `guest-register-form`).
    await expect(guest.upgradeForm).toBeVisible();

    // When they complete the registration form with valid details
    await registration.firstName.fill("Nathan");
    await registration.lastName.fill("Robinson");
    await registration.email.fill(`nathan.robinson+${Date.now()}@upmind.com`);
    await registration.password.fill("Password1!");
    await guest.upgradeFormSubmit.click();

    // Then they become a fully registered client (guest → client session)
    await expect
      .poll(
        async () => {
          const cookies = await context.cookies();
          return cookies.some(c => c.name === "upm_client_session");
        },
        { timeout: 30000 }
      )
      .toBeTruthy();
  });
});
