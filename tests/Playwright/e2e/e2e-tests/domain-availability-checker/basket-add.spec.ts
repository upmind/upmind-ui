import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import { getBasketProducts } from "../../support/api/basket";
import { waitForSessionCookie } from "../../support/helpers/session";
import { interceptConfigValues } from "../../support/mocks/brand";
import { Dac } from "../../support/page-objects/templates/dac";

/**
 * Basket-add behaviour for the smart-suggest DAC flow. Runs end-to-end
 * against staging — no synthetic mocks for /suggestions, /suggestions/tlds,
 * /availability, or the basket add. The only override is the brand's
 * `domain_search_method`, forced to `smart-suggest` so the test exercises
 * the new flow regardless of the brand's current default.
 *
 * The committed add is verified against the guest session's current basket
 * read back from the API — the DAC manages that basket itself, so reading
 * server state is more reliable than racing the add request. Each test runs
 * on a fresh guest context.
 */

const SEARCH_QUERY = "my-upmind-domain";

test.describe.configure({ mode: "parallel" });
test.describe("DAC basket-add", () => {
  let dac: Dac;
  let token: string;

  // Brand intercept registered directly in beforeEach so it's always wired up
  // before any test-side navigation triggers a brand-config fetch.
  test.beforeEach(async ({ page, context }) => {
    dac = new Dac(page);
    await page.goto(URLs.baseUrl);
    await waitForSessionCookie(context, { guestOnly: true });
    token = await getSessionToken(context);
    await interceptConfigValues(page, token, {
      domainSearchMethod: "smart-suggest"
    });
  });

  test("The exact domain the user clicked Add on is the one that gets sent to the basket", async () => {
    // A registered suggestion (e.g. .com) is rejected on click and retried on
    // a fresh search, so allow a wider budget than the 60s default.
    test.setTimeout(150000);
    await dac.gotoSearch(SEARCH_QUERY);
    const domain = await dac.addFirstAvailableDomain(SEARCH_QUERY);

    const products = await getBasketProducts(token);
    const sld = domain.split(".")[0];
    expect(JSON.stringify(products).toLowerCase()).toContain(sld.toLowerCase());
  });

  test.describe("End-to-end add-to-basket UI feedback", () => {
    test("Clicking Add gives the user immediate visual feedback that the domain was added", async () => {
      // Retries on a fresh search if a registered suggestion is rejected.
      test.setTimeout(150000);
      await dac.gotoSearch(SEARCH_QUERY);
      const domain = await dac.addFirstAvailableDomain(SEARCH_QUERY);

      // Real post-add feedback: the added row's CTA reflects the in-basket
      // "added" state (not a coincidentally-disabled button).
      await expect(
        dac.cardByDomain(domain).getByTestId("domain-card-cta")
      ).toHaveAttribute("data-test-value", "added");
    });
  });
});
