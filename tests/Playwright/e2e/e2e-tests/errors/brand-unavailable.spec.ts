import { test, expect } from "@playwright/test";
import { interceptBrandUnavailable } from "../../support/mocks/brand";

/**
 * Brand-unavailable redirect (FE-2554 / FE-2793)
 *
 * Gherkin: tests/features/errors/brand-unavailable-redirect.feature
 *   @layer-e2e @FE-2793
 *
 * When the arrival domain resolves to no configured brand, `useUpmind` treats
 * the brand as unavailable and abandons cart start-up with a hard
 * `window.location` redirect to the Upmind platform (`platformUrl`). The whole
 * deliverable had zero e2e coverage — a regression would silently strand a
 * visitor on a broken cart shell instead of handing them off. This proves the
 * user-visible hand-off end to end.
 *
 * Distinct from the `brandUnavailable` case in `error-handling.spec.ts`: that
 * drives the 503 *error* path on brand settings; this drives the availability
 * check itself — a real 200 brand response that simply carries no `name`.
 *
 * The `isAvailable` boolean, its negative branch and the init
 * `Promise.reject()` short-circuit stay covered at unit/integration.
 */
test.describe("Brand-unavailable redirect", () => {
  // Clean up the brand-settings route so it never leaks into later tests.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  test("A visitor on a domain with no configured brand is sent to the Upmind platform", async ({
    page
  }) => {
    // Given — the arrival domain resolves to a brand with no name (unavailable).
    // Attach before the navigation that boots the cart.
    await interceptBrandUnavailable(page);

    // When — the cart starts up.
    await page.goto("/");

    // Then — the visitor lands on the Upmind platform, not the cart. Assert the
    // redirect target the same way the sibling homepage-redirect case does
    // (retrying on the current URL, so it does not hang on the external site's
    // load event). Reaching `platformUrl` implies the cart shell was abandoned.
    await expect(page).toHaveURL(/upmind\.com/);
  });
});
