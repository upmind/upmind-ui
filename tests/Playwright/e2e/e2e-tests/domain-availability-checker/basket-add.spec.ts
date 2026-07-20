import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { getBasketProductsViaHeadless } from "../../support/flows";
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

  // Brand intercept registered directly in beforeEach so it's always wired up
  // before any test-side navigation triggers a brand-config fetch.
  test.beforeEach(async ({ page }) => {
    dac = new Dac(page);
    await page.goto(URLs.baseUrl);
    await interceptConfigValues(page, {
      domainSearchMethod: "smart-suggest"
    });
  });

  test("The exact domain the user clicked Add on is the one that gets sent to the basket", async ({
    page
  }) => {
    // A registered suggestion (e.g. .com) is rejected on click and retried on
    // a fresh search, so allow a wider budget than the 60s default.
    test.setTimeout(150000);
    await dac.gotoSearch(SEARCH_QUERY);
    const domain = await dac.addFirstAvailableDomain(SEARCH_QUERY);

    const products = await getBasketProductsViaHeadless(page);
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

  // The two tests above search a bare SLD whose first suggestion is `.com`.
  // Dom removed the `.com` required multi-choice option on staging, so a
  // one-click Add now commits — test 1 verifies this via the live basket.
  // Test 2's in-place `added` CTA assertion still fails because the
  // smart-suggest card does not reflect the in-basket state without a
  // re-search (verified: click commits the domain, basket count rises, but
  // the card CTA stays `register` until a reload). That is a product/UX
  // behaviour flagged to product, not a test-layer defect, so the assertion
  // is left intact. This test proves the add-to-basket mechanism
  // independently, using a clean `.co.uk` exact domain.
  test("adds a domain with no required config to the basket (.co.uk)", async ({
    page
  }) => {
    const domain = `my-upmind-domain-${Date.now()}.co.uk`;
    await dac.gotoSearch(domain);
    await dac.addExactDomain(domain);

    const products = await getBasketProductsViaHeadless(page);
    const sld = domain.split(".")[0];
    expect(JSON.stringify(products).toLowerCase()).toContain(sld.toLowerCase());
  });
});
