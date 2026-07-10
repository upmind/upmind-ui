import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { setLocale } from "../support/helpers/locale";
import { Languages as languages } from "../support/constants/languages";
import { waitForSessionCookie } from "../support/helpers";
import { interceptConfigValues } from "../support/mocks/brand";
import {
  mockDomainSuggestions,
  mockDomainSuggestionsTlds,
  mockDomainAvailability
} from "../support/mocks/domain";
import {
  baselineSuggestionRows,
  domainProducts,
  domainProductIds
} from "../support/constants/domain-suggestions";
import { Dac } from "../support/page-objects/templates/dac";

/**
 * @fileoverview Catalogue Visual Regression Tests
 *
 * ## Job To Be Done
 * Locks the pixel appearance of the storefront catalogue surfaces across all
 * supported locales (incl. the RTL locale). The smart-suggest DAC block below
 * guards the domain-search RESULTS view — fully-priced cards, the price/button
 * skeleton loading window, and the exact-match available/unavailable states —
 * which the existing "Domain Search" test does not (it only shots the empty
 * entry page). All DAC states are driven by deterministic route mocks so the
 * screenshots are stable regardless of staging inventory.
 *
 * ## What Breaks If These Fail
 * A regression in the DAC result-card layout, price rendering, skeleton
 * placeholders, or exact-match styling — silently, in the very view a customer
 * hits when searching for a domain to buy — would ship unnoticed across 28
 * locales.
 */

const DAC_SLD = "mybusiness";
const DAC_EXACT_DOMAIN = `${DAC_SLD}.com`;

for (const { language, locale } of languages) {
  test.describe(`Catalogue Visual Regression Tests - ${language}`, () => {
    test.beforeEach(async ({ page }) => {
      // Disable all CSS animations and transitions
      await page.addStyleTag({
        content: `
          *,
          *::before,
          *::after {
            transition: none !important;
            animation: none !important;
            caret-color: transparent !important;
          }
        `
      });
    });
    test("Catalogue Root - Page 1", async ({ page }) => {
      await page.goto(URLs.catalogueRoot1);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId("product-search")).toBeVisible();
      await expect(page.getByTestId("product-card").first()).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`${language}/catalogue-page-1`, {
        mask: [page.locator("img")],
        fullPage: true
      });
    });
    // test('Catalogue Root - Page 2', async ({page}) => {

    // });
    test("Category Page", async ({ page }) => {
      await page.goto(URLs.categoryPage);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId("product-search")).toBeVisible();
      await expect(page.getByTestId("product-card").first()).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`${language}/category-page`, {
        mask: [page.locator("img")],
        fullPage: true
      });
    });
    test("Nested Category page", async ({ page }) => {
      await page.goto(URLs.nestedCategoryPage);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId("product-search")).toBeVisible();
      await expect(page.getByTestId("product-card").first()).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`${language}/nested-category-page`, {
        mask: [page.locator("img")],
        fullPage: true
      });
    });
    test("Domain Search", async ({ page }) => {
      await page.goto(URLs.catalogueDomainSearch);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(
        page
          .getByTestId("input")
          .and(page.locator('[data-test-value="domain-search-input"]'))
      ).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(
        `${language}/catalogue-domain-search`,
        {
          mask: [page.locator("lord-icon")],
          fullPage: true
        }
      );
    });
    test("Domain Search - Results (fully priced)", async ({
      page,
      context
    }) => {
      const dac = new Dac(page);
      await interceptConfigValues(page, {
        domainSearchMethod: "smart-suggest"
      });
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(DAC_SLD) });
      mockDomainSuggestionsTlds(context, { products: domainProducts });
      await dac.gotoSearch(DAC_SLD);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(dac.results).toBeVisible({ timeout: 15000 });
      await expect(dac.firstCard.getByTestId("domain-card-price")).toBeVisible({
        timeout: 15000
      });
      await expect(dac.buttonLoadingSkeletons).toHaveCount(0);
      await expect(page).toHaveScreenshot(`${language}/dac-results-priced`, {
        mask: [page.locator("lord-icon")],
        fullPage: true
      });
    });
    test("Domain Search - Results (loading skeletons)", async ({
      page,
      context
    }) => {
      const dac = new Dac(page);
      await interceptConfigValues(page, {
        domainSearchMethod: "smart-suggest"
      });
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(DAC_SLD) });
      mockDomainSuggestionsTlds(context, {
        products: domainProducts,
        latencyMs: 30000
      });
      await dac.gotoSearch(DAC_SLD);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(dac.results).toBeVisible({ timeout: 15000 });
      await expect(dac.priceLoadingSkeletons.first()).toBeVisible({
        timeout: 15000
      });
      await expect(dac.buttonLoadingSkeletons.first()).toBeVisible();
      await expect(page).toHaveScreenshot(`${language}/dac-results-loading`, {
        mask: [page.locator("lord-icon")],
        fullPage: true
      });
    });
    test("Domain Search - Exact match available", async ({ page, context }) => {
      const dac = new Dac(page);
      await interceptConfigValues(page, {
        domainSearchMethod: "smart-suggest"
      });
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(DAC_SLD) });
      mockDomainSuggestionsTlds(context, { products: domainProducts });
      mockDomainAvailability(context, {
        byDomain: {
          [DAC_EXACT_DOMAIN]: {
            can_register: true,
            can_transfer: false,
            is_premium: false,
            product_id: domainProductIds.com,
            product: domainProducts[domainProductIds.com]
          }
        }
      });
      await dac.gotoSearch(DAC_EXACT_DOMAIN);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(dac.results).toBeVisible({ timeout: 15000 });
      const cardName = dac.firstCard.getByTestId("domain-card-name");
      await expect(cardName).toBeVisible({ timeout: 15000 });
      await expect(cardName).toHaveAttribute(
        "data-test-value",
        DAC_EXACT_DOMAIN
      );
      await expect(dac.buttonLoadingSkeletons).toHaveCount(0);
      await expect(dac.addToBasketButtonOnCard()).toHaveAttribute(
        "data-test-value",
        "register"
      );
      await expect(page).toHaveScreenshot(
        `${language}/dac-exact-match-available`,
        {
          mask: [page.locator("lord-icon")],
          fullPage: true
        }
      );
    });
    test("Domain Search - Exact match unavailable", async ({
      page,
      context
    }) => {
      const dac = new Dac(page);
      await interceptConfigValues(page, {
        domainSearchMethod: "smart-suggest"
      });
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(DAC_SLD) });
      mockDomainSuggestionsTlds(context, { products: domainProducts });
      mockDomainAvailability(context, {
        byDomain: {
          [DAC_EXACT_DOMAIN]: {
            can_register: false,
            can_transfer: false,
            is_premium: false
          }
        }
      });
      await dac.gotoSearch(DAC_EXACT_DOMAIN);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(dac.results).toBeVisible({ timeout: 15000 });
      const cardName = dac.firstCard.getByTestId("domain-card-name");
      await expect(cardName).toBeVisible({ timeout: 15000 });
      await expect(cardName).toHaveAttribute(
        "data-test-value",
        DAC_EXACT_DOMAIN
      );
      await expect(dac.addToBasketButtonOnCard()).toHaveAttribute(
        "data-test-value",
        "unavailable"
      );
      await expect(page).toHaveScreenshot(
        `${language}/dac-exact-match-unavailable`,
        {
          mask: [page.locator("lord-icon")],
          fullPage: true
        }
      );
    });
  });
}
