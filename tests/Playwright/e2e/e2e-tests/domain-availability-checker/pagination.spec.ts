import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
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
  test.beforeEach(async ({ page }) => {
    dac = new Dac(page);
    await page.goto(URLs.baseUrl);
    await interceptConfigValues(page, {
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
      // Price is mocked deterministically (baseProduct, 12-month → £12.00), read
      // locale-stably via domain-card-price's data-test-value.
      const priceCell = dac.firstCard.getByTestId("domain-card-price");
      await expect(priceCell).toBeVisible();
      await expect(priceCell).toHaveAttribute("data-test-value", "£12.00");
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
      // 2 (page 1) + 1 net-new (.au) = 3, .com NOT duplicated. The .com domain
      // is stable test data carried locale-stably in `domain-card-name`'s
      // `data-test-value`, so count those rather than scraping rendered text.
      await expect(dac.cards).toHaveCount(3, { timeout: 10000 });
      await expect(
        dac.page
          .getByTestId("domain-card-name")
          .and(dac.page.locator(`[data-test-value="${SLD}.com"]`))
      ).toHaveCount(1);
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
        // /tlds lags /suggestions so the page-1 .com row renders in its
        // priceLoading state before /tlds settles. Once page-1 /tlds resolves
        // empty, the unpriced row is dropped (the app's anti-"infinity
        // loading" rule), so the skeleton is only observable during this lag.
        latencyMs: 1500,
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
      // The .com row upgrades to its mocked price (baseProduct, 12-month →
      // £12.00) once page-2 /tlds brings the product in; read via
      // domain-card-price's data-test-value.
      const priceCell = dac.firstCard.getByTestId("domain-card-price");
      await expect(priceCell).toBeVisible();
      await expect(priceCell).toHaveAttribute("data-test-value", "£12.00");
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
      // Page-1 .com prices from the page-1 /tlds product (baseProduct, 12-month
      // → £12.00), read via domain-card-price's data-test-value.
      const firstPrice = dac.firstCard.getByTestId("domain-card-price");
      await expect(firstPrice).toBeVisible();
      await expect(firstPrice).toHaveAttribute("data-test-value", "£12.00");

      await dac.clickLoadMore();

      await expect(dac.cards).toHaveCount(2, { timeout: 10000 });
      // Page-2 /tlds is empty, so the page-2 .com row must price from the
      // cumulative map populated by page 1 — same mocked £12.00.
      const secondPrice = dac.card(1).getByTestId("domain-card-price");
      await expect(secondPrice).toBeVisible();
      await expect(secondPrice).toHaveAttribute("data-test-value", "£12.00");
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
