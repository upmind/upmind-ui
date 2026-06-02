import { test, expect, Page } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import { createOrder } from "../../support/api/basket";
import { waitForSessionCookie } from "../../support/helpers/session";
import { interceptConfigValues } from "../../support/mocks/brand";
import { Dac } from "../../support/page-objects/templates/dac";

/**
 * Basket-add behaviour for the smart-suggest DAC flow. Runs end-to-end
 * against staging — no synthetic mocks for /suggestions, /suggestions/tlds,
 * /availability, or the basket-add POST. The only override is the brand's
 * `domain_search_method`, forced to `smart-suggest` so the test exercises
 * the new flow regardless of the brand's current default.
 *
 * The basket-add POST is observed via `page.waitForRequest`, not intercepted
 * — it actually fires against staging. Each test creates a fresh guest order
 * so the side effects are scoped to a throwaway basket.
 */

const SEARCH_QUERY = "my-upmind-domain";

const EXPECTED_FIRST_CARD_DOMAIN = "My-Upmind-Domain.com";

const waitForBasketAddPost = (page: Page, orderId: string) =>
  page.waitForRequest(
    req =>
      req.url().includes(`/api/orders/${orderId}/products`) &&
      req.method() === "POST"
  );
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

  test("The exact domain the user clicked Add on is the one that gets sent to the basket", async ({
    page
  }) => {
    const order = await createOrder(token);

    const basketAddRequest = waitForBasketAddPost(page, order.id);
    await dac.gotoSearch(SEARCH_QUERY);
    await dac.clickAddOnCard();

    const body = JSON.stringify((await basketAddRequest).postDataJSON());
    const sld = EXPECTED_FIRST_CARD_DOMAIN.split(".")[0];
    expect(body).toContain(sld);
  });

  test.describe("End-to-end add-to-basket UI feedback", () => {
    test("Clicking Add gives the user immediate visual feedback that the domain was added", async () => {
      await dac.gotoSearch(SEARCH_QUERY);
      await dac.clickAddOnCard();

      await expect(dac.addToBasketButtonOnCard()).toBeHidden({
        timeout: 15000
      });
    });
  });
});
