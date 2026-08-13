import { test, expect, Page } from "@playwright/test";
import { URLs, ProductIds } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import { createOrder } from "../../support/api/basket";
import { waitForSessionCookie } from "../../support/helpers/session";
import { interceptConfigValues } from "../../support/mocks/brand";
import { Dac } from "../../support/page-objects/templates/dac";

/**
 * `tlds` through the domains funnel, end to end against staging. The client
 * form is comma-delimited and tolerates leading dots (`?tlds=.io`); the API
 * takes bare labels, so both forms are asserted.
 *
 * `tlds` shapes the SUGGESTIONS only — the exact domain the user typed is
 * always offered (services.ts reserves row 0 for /availability), so the
 * assertions below exclude the exact-match row.
 */

const SEARCH_QUERY = "my-upmind-domain";

const ALLOWED = "io";

const funnelUrl = (tlds?: string) =>
  `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&funnel=domains${
    tlds ? `&tlds=${tlds}` : ""
  }`;

const suggestionsTldParams = (page: Page): Promise<string[]> =>
  page
    .waitForRequest(req =>
      req.url().includes("/modules/web_hosting/domains/suggestions")
    )
    .then(req => new URL(req.url()).searchParams.getAll("tlds[]"));

const waitForBasketAddPost = (page: Page, orderId: string) =>
  page.waitForRequest(
    req =>
      req.url().includes(`/api/orders/${orderId}/products`) &&
      req.method() === "POST"
  );

const suggestionTlds = async (dac: Dac): Promise<string[]> => {
  await expect(dac.firstCard).toBeVisible({ timeout: 30000 });
  const texts = await dac.cards.allInnerTexts();
  return texts
    .filter(text => !/exact match/i.test(text))
    .flatMap(text => {
      const match = text.match(/[\w-]+((?:\.[a-z]{2,})+)/i);
      return match ? [match[1].slice(1).toLowerCase()] : [];
    });
};

test.describe.configure({ mode: "parallel" });
test.describe("DAC tlds filter through the domains funnel", () => {
  let dac: Dac;
  let token: string;

  test.beforeEach(async ({ page, context }) => {
    dac = new Dac(page);
    await page.goto(URLs.baseUrl);
    await waitForSessionCookie(context, { guestOnly: true });
    token = await getSessionToken(context);
    await interceptConfigValues(page, token, {
      domainSearchMethod: "smart-suggest"
    });
  });

  test("With tlds, suggestions are limited to it and it survives the whole funnel", async ({
    page
  }) => {
    const order = await createOrder(token);
    const requestedTlds = suggestionsTldParams(page);

    await page.goto(funnelUrl(`.${ALLOWED}`));
    await expect(page).toHaveURL(/\/order\/domains\//, { timeout: 30000 });
    expect(page.url()).toContain(`tlds=${ALLOWED}`);

    await dac.searchFor(SEARCH_QUERY);
    expect(await requestedTlds).toEqual([ALLOWED]);

    const offered = await suggestionTlds(dac);
    expect(offered.length).toBeGreaterThan(0);
    expect(offered.every(tld => tld === ALLOWED)).toBe(true);

    const basketAdd = waitForBasketAddPost(page, order.id);
    await dac.clickAddOnCard();
    expect((await basketAdd).postDataJSON()).toMatchObject({
      provision_field_values: {
        sld: expect.stringMatching(new RegExp(`^${SEARCH_QUERY}$`, "i"))
      }
    });

    await dac.continueButton.click();
    await expect(page).toHaveURL(new RegExp(`tlds=${ALLOWED}`), {
      timeout: 30000
    });
  });

  test("Without tlds, suggestions span more than one tld", async ({ page }) => {
    const requestedTlds = suggestionsTldParams(page);

    await page.goto(funnelUrl());
    await expect(page).toHaveURL(/\/order\/domains\//, { timeout: 30000 });

    await dac.searchFor(SEARCH_QUERY);
    expect(await requestedTlds).toEqual([]);

    expect(new Set(await suggestionTlds(dac)).size).toBeGreaterThan(1);
  });
});
