import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import { waitForSessionCookie } from "../../support/helpers/session";
import { interceptConfigValues } from "../../support/mocks/brand";
import {
  mockDomainSuggestions,
  mockDomainSuggestionsTlds
} from "../../support/mocks/domain";
import {
  baselineSuggestionRows,
  domainProducts,
  domainProductIds,
  suggestionRow
} from "../../support/constants/domain-suggestions";
import { Dac } from "../../support/page-objects/templates/dac";

/**
 * /suggestions + /suggestions/tlds merge & pagination contract:
 *   - /tlds arriving after /suggestions upgrades cards in-place (no remount)
 *   - "Load more" appends; previously priced rows are never overwritten
 *   - Cumulative `productsMap` lets page-N rows price using earlier-page TLDs
 *   - A new query resets the cumulative map and pagination
 *   - Per-card Add buttons are disabled while a Load more is in flight
 */

const SLD = "my-upmind-domain";
test.describe.configure({ mode: "parallel" });
test.describe("DAC pagination & merge logic", () => {
  let dac: Dac;

  // Brand intercept registered directly in beforeEach so it's always wired up
  // before any test-side navigation triggers a brand-config fetch.
  test.beforeEach(async ({ page, context }) => {
    dac = new Dac(page);
    await page.goto(URLs.baseUrl);
    await waitForSessionCookie(context, { guestOnly: true });
    const token = await getSessionToken(context);
    await interceptConfigValues(page, token, {
      domainSearchMethod: "smart-suggest"
    });
  });

  test.describe("In-place price upgrade", () => {
    test("Domain card prices fill in smoothly without the cards re-rendering", async ({
      context
    }) => {
      const rows = [
        suggestionRow(SLD, ".com", domainProductIds.com),
        suggestionRow(SLD, ".net", domainProductIds.net),
        suggestionRow(SLD, ".au", domainProductIds.au)
      ];
      // /tlds is held back so the priceLoading → priced transition is observable.
      mockDomainSuggestions(context, { rows, latencyMs: 50 });
      mockDomainSuggestionsTlds(context, {
        products: domainProducts,
        latencyMs: 1500
      });

      await dac.gotoSearch(SLD);

      await expect(dac.cards).toHaveCount(3);
      await expect(dac.priceLoadingSkeletons.first()).toBeVisible();

      await expect(dac.priceLoadingSkeletons.first()).toBeHidden({
        timeout: 10000
      });
      await expect(dac.cards).toHaveCount(3);
      await expect(dac.firstCard).toContainText("£12.00");
    });
  });

  test.describe("Page-2 merge rules", () => {
    test("Loading more results doesn't replace or duplicate domains the user has already seen", async ({
      context
    }) => {
      // 4 total results, 2 per page → 2 pages. Page 2 repeats .com so the
      // merge logic has to dedupe by domain.
      mockDomainSuggestions(context, {
        limit: 1,
        builder: ({ page: pageNum }) =>
          pageNum === 1
            ? {
                rows: [
                  suggestionRow(SLD, "com", domainProductIds.com),
                  suggestionRow(SLD, "net", domainProductIds.net)
                ],
                totalPages: 2
              }
            : {
                rows: [
                  suggestionRow(SLD, "com", domainProductIds.com),
                  suggestionRow(SLD, "au", domainProductIds.au)
                ],
                totalPages: 2
              }
      });
      mockDomainSuggestionsTlds(context, { products: domainProducts });

      await dac.gotoSearch(SLD);
      await expect(dac.cards).toHaveCount(2);
      await dac.clickLoadMore();
      // 2 (page 1) + 1 net-new (.au) = 3, .com NOT duplicated
      await expect(dac.cards).toHaveCount(3, { timeout: 10000 });
      const headings = await dac.cards.allTextContents();
      const comOccurrences = headings.filter(t =>
        t.includes(`${SLD}.com`)
      ).length;
      expect(comOccurrences).toBe(1);
    });

    test("A domain still waiting for its price gets priced when loading more brings the data in", async ({
      context
    }) => {
      // Page 1 /tlds returns no products → page 1 .com row stays priceLoading.
      // Page 2 /tlds returns the .com product → row should upgrade.
      mockDomainSuggestions(context, {
        limit: 2,
        builder: ({ page: pageNum }) =>
          pageNum === 1
            ? {
                rows: [suggestionRow(SLD, "com", domainProductIds.com)],
                totalPages: 2
              }
            : {
                rows: [
                  suggestionRow(SLD, "com", domainProductIds.com),
                  suggestionRow(SLD, "net", domainProductIds.net)
                ],
                totalPages: 2
              }
      });
      mockDomainSuggestionsTlds(context, {
        builder: ({ page: pageNum }) =>
          pageNum === 1
            ? { products: {} }
            : {
                products: {
                  [domainProductIds.com]: domainProducts[domainProductIds.com],
                  [domainProductIds.net]: domainProducts[domainProductIds.net]
                }
              }
      });

      await dac.gotoSearch(SLD);
      await expect(dac.priceLoadingSkeletons.first()).toBeVisible();

      await dac.clickLoadMore();

      await expect(dac.cards).toHaveCount(2, { timeout: 10000 });
      await expect(dac.priceLoadingSkeletons).toHaveCount(0);
      await expect(dac.firstCard).toContainText("£12.00");
    });
  });

  test.describe("Cumulative productsMap", () => {
    test("Prices stay correct as the user pages through results", async ({
      context
    }) => {
      // Page 2 /tlds is empty — the .com price must come from the cumulative
      // map populated by page 1.
      mockDomainSuggestions(context, {
        limit: 1,
        builder: ({ page: pageNum }) =>
          pageNum === 1
            ? {
                rows: [
                  suggestionRow(`${SLD}-one`, "com", domainProductIds.com)
                ],
                totalPages: 2
              }
            : {
                rows: [
                  suggestionRow(`${SLD}-two`, "com", domainProductIds.com)
                ],
                totalPages: 2
              }
      });
      mockDomainSuggestionsTlds(context, {
        builder: ({ page: pageNum }) =>
          pageNum === 1
            ? {
                products: {
                  [domainProductIds.com]: domainProducts[domainProductIds.com]
                }
              }
            : { products: {} }
      });

      await dac.gotoSearch(SLD);
      await expect(dac.firstCard).toContainText("£12.00");

      await dac.clickLoadMore();

      await expect(dac.cards).toHaveCount(2, { timeout: 10000 });
      await expect(dac.card(1)).toContainText("£12.00");
      await expect(dac.priceLoadingSkeletons).toHaveCount(0);
    });
  });

  test.describe("New search resets state", () => {
    test("Starting a new search resets pagination back to the first page", async ({
      page,
      context
    }) => {
      mockDomainSuggestions(context, {
        limit: 1,
        builder: ({ query }) => ({
          rows: [suggestionRow(query, "com", domainProductIds.com)],
          totalPages: 2
        })
      });
      mockDomainSuggestionsTlds(context, { products: domainProducts });

      // Always-on listener attached BEFORE any navigation — captures every
      // /suggestions request's query + tlds_page so we can inspect the
      // sequence after the test runs.
      const suggestionsCalls: Array<{
        query: string | null;
        tldsPage: string | null;
      }> = [];
      page.on("request", req => {
        const url = req.url();
        if (
          !url.includes("/modules/web_hosting/domains/suggestions?") ||
          url.includes("/suggestions/tlds")
        ) {
          return;
        }
        const u = new URL(url);
        suggestionsCalls.push({
          query: u.searchParams.get("query"),
          tldsPage: u.searchParams.get("tlds_page")
        });
      });

      await dac.gotoSearch(SLD);
      await expect(dac.cards).toHaveCount(1);

      await dac.clickLoadMore();
      await expect(dac.cards).toHaveCount(1, { timeout: 10000 });

      await dac.gotoSearch("anothertry");
      await expect(dac.firstCard).toBeVisible();

      // The new query must restart at tlds_page=1, not continue from where
      // the previous round left off.
      const newQueryCalls = suggestionsCalls.filter(
        c => c.query === "anothertry"
      );
      expect(newQueryCalls.length).toBeGreaterThan(0);
      expect(newQueryCalls[0].tldsPage).toBe("1");
    });
  });

  test.describe("Load more", () => {
    test("Clicking Load more fetches and appends the next page of results", async ({
      page,
      context
    }) => {
      mockDomainSuggestions(context, {
        limit: 5,
        builder: ({ page: pageNum }) =>
          pageNum === 1
            ? { rows: baselineSuggestionRows(SLD), totalPages: 2 }
            : {
                rows: [
                  suggestionRow(`${SLD}-uk`, ".com", domainProductIds.com),
                  suggestionRow(`${SLD}-uk`, ".net", domainProductIds.net),
                  suggestionRow(`${SLD}-uk`, ".au", domainProductIds.au)
                ],
                totalPages: 2
              }
      });
      mockDomainSuggestionsTlds(context, { products: domainProducts });
      // Always-on listener attached BEFORE the click — captures the page-2
      // request's URL so we can assert on it after the rows have rendered.
      const page2Calls: string[] = [];
      page.on("request", req => {
        const url = req.url();
        if (
          url.includes("/modules/web_hosting/domains/suggestions?") &&
          !url.includes("/suggestions/tlds") &&
          url.includes("tlds_page=2")
        ) {
          page2Calls.push(url);
        }
      });
      await dac.gotoSearch(SLD);
      await expect(dac.cards).toHaveCount(5);
      await expect(dac.loadMoreButton).toBeVisible();
      await dac.clickLoadMore();

      // Page-2 rows arriving proves the request fired and resolved.
      await expect(dac.cards).toHaveCount(8, { timeout: 10000 });

      expect(page2Calls.length).toBeGreaterThan(0);
      expect(page2Calls[0]).toContain("tlds_page=2");
      expect(page2Calls[0]).toContain("limit=20");

      await expect(dac.loadMoreButton).toBeHidden();
    });

    test("Existing Add to basket buttons are disabled while loading more results", async ({
      context
    }) => {
      mockDomainSuggestions(context, {
        limit: 2,
        builder: ({ page: pageNum }) =>
          pageNum === 1
            ? {
                rows: [
                  suggestionRow(SLD, "com", domainProductIds.com),
                  suggestionRow(SLD, "net", domainProductIds.net)
                ],
                totalPages: 2
              }
            : {
                rows: [suggestionRow(SLD, "au", domainProductIds.au)],
                totalPages: 2
              }
      });
      // Slow /tlds so the in-flight disabled state is observable.
      mockDomainSuggestionsTlds(context, {
        products: domainProducts,
        latencyMs: 2000
      });

      await dac.gotoSearch(SLD);
      await expect(dac.cards).toHaveCount(2);

      await dac.clickLoadMore();

      await expect(dac.loadMoreButton).toBeDisabled();
      const total = await dac.cardAddToBasketButtons.count();
      for (let i = 0; i < total; i++) {
        await expect(dac.cardAddToBasketButtons.nth(i)).toBeDisabled();
      }

      await expect(dac.cards).toHaveCount(3, { timeout: 10000 });
      await expect(dac.cardAddToBasketButtons.first()).toBeEnabled();
    });
  });
});
