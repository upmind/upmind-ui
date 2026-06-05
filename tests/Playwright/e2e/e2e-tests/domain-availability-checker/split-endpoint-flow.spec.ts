import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import { waitForSessionCookie } from "../../support/helpers/session";
import { interceptConfigValues } from "../../support/mocks/brand";
import {
  mockDomainSuggestions,
  mockDomainSuggestionsTlds,
  mockDomainAvailability
} from "../../support/mocks/domain";
import {
  baselineSuggestionRows,
  domainProducts,
  domainProductIds
} from "../../support/constants/domain-suggestions";
import { Dac } from "../../support/page-objects/templates/dac";

/**
 * Split-endpoint DAC flow, gated by brand setting
 * `provisioning.domain_names.search_method`:
 *   - "smart-suggest" → /suggestions + /suggestions/tlds (+ /availability for TLDs)
 *   - "legacy-lookup" → single /search call
 *
 * Mocks must be registered BEFORE the navigation that triggers them.
 */

const SLD = "mybusiness";
test.describe.configure({ mode: "parallel" });
test.describe("Domain split-endpoint DAC flow", () => {
  let dac: Dac;

  test.beforeEach(({ page }) => {
    dac = new Dac(page);
  });

  test.describe("Brand setting drives flow selection", () => {
    // Each test sets up its own brand intercept directly — the two tests
    // exercise different `domain_search_method` values so a shared
    // beforeEach wouldn't fit.

    test("Searching on a smart-suggest brand uses the new split-endpoint search", async ({
      page,
      context
    }) => {
      await page.goto(URLs.baseUrl);
      await waitForSessionCookie(context, { guestOnly: true });
      const token = await getSessionToken(context);
      await interceptConfigValues(page, token, {
        domainSearchMethod: "smart-suggest"
      });
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(SLD) });
      mockDomainSuggestionsTlds(context, { products: domainProducts });
      // Always-on listeners attached BEFORE navigation — record both
      // endpoint hits synchronously into flags.
      const hits = { suggestions: false, tlds: false };
      page.on("request", req => {
        const url = req.url();
        if (
          url.includes("/modules/web_hosting/domains/suggestions?") &&
          !url.includes("/suggestions/tlds")
        ) {
          hits.suggestions = true;
        } else if (
          url.includes("/modules/web_hosting/domains/suggestions/tlds?")
        ) {
          hits.tlds = true;
        }
      });
      await dac.gotoSearch(SLD);
      await expect(dac.firstCard).toBeVisible();
      expect(hits.suggestions).toBe(true);
      expect(hits.tlds).toBe(true);
    });

    test("Searching on a legacy-lookup brand uses the legacy single-call search", async ({
      page,
      context
    }) => {
      // Register the override BEFORE the first load: domain_search_method is
      // fetched and cached on initial load, so the intercept must be active for
      // that fetch (registering it after goto misses it and staging's default
      // smart-suggest wins). null token replays the request's own guest auth and
      // strips cache-validation headers so the override isn't lost to a 304.
      await interceptConfigValues(page, null, {
        domainSearchMethod: "legacy-lookup"
      });
      await page.goto(URLs.baseUrl);
      await waitForSessionCookie(context, { guestOnly: true });
      const searchResponse = page.waitForResponse(res =>
        res.url().includes("/modules/web_hosting/domains/search")
      );
      await dac.gotoSearch(SLD);
      // Once /search resolves, the search round is over — the two flows are
      // mutually exclusive, so any /suggestions calls would have fired by now.
      await searchResponse;
    });
  });

  test.describe("Progressive rendering", () => {
    test.beforeEach(async ({ page, context }) => {
      await page.goto(URLs.baseUrl);
      await waitForSessionCookie(context, { guestOnly: true });
      const token = await getSessionToken(context);
      await interceptConfigValues(page, token, {
        domainSearchMethod: "smart-suggest"
      });
    });

    test("Domain cards appear with price skeletons while prices are loading, then prices fill in", async ({
      context
    }) => {
      // /suggestions fast, /tlds slow — exposes the priceLoading skeleton
      // window between the two responses. Bump `latencyMs` if the assertion
      // is flaky on slower CI; do NOT use CDP `Network.emulateNetworkConditions`
      // — it throttles the JS bundle too and times out `page.goto`.
      mockDomainSuggestions(context, {
        rows: baselineSuggestionRows(SLD),
        latencyMs: 50
      });
      mockDomainSuggestionsTlds(context, {
        products: domainProducts,
        latencyMs: 3000
      });

      await dac.gotoSearch(SLD);

      await expect(dac.firstCard).toBeVisible();
      await expect(dac.priceLoadingSkeletons.first()).toBeVisible();
      await expect(dac.buttonLoadingSkeletons.first()).toBeVisible();

      await expect(dac.priceLoadingSkeletons.first()).toBeHidden({
        timeout: 10000
      });
      // Confirm that the price eventually loads.
      await expect(dac.firstCard.getByText("£12.00").nth(1)).toBeVisible();
    });

    test("If the price service fails, domain results still appear (just without prices)", async ({
      context
    }) => {
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(SLD) });
      mockDomainSuggestionsTlds(context, { errorStatus: 500 });

      await dac.gotoSearch(SLD);

      await expect(dac.firstCard).toBeVisible();
      await expect(dac.priceLoadingSkeletons.first()).toBeVisible();
    });
  });

  test.describe("Exact-match (TLD in query)", () => {
    const exactDomain = `${SLD}.com`;

    test.beforeEach(async ({ page, context }) => {
      await page.goto(URLs.baseUrl);
      await waitForSessionCookie(context, { guestOnly: true });
      const token = await getSessionToken(context);
      await interceptConfigValues(page, token, {
        domainSearchMethod: "smart-suggest"
      });
    });

    test("Searching for an available domain with a TLD shows the exact match with its price", async ({
      page,
      context
    }) => {
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(SLD) });
      mockDomainSuggestionsTlds(context, { products: domainProducts });
      mockDomainAvailability(context, {
        byDomain: {
          [exactDomain]: {
            can_register: true,
            can_transfer: false,
            is_premium: false,
            product_id: domainProductIds.com,
            product: domainProducts[domainProductIds.com]
          }
        }
      });

      // Listener attached BEFORE navigation — captures the /availability
      // call regardless of when in the lifecycle it fires.
      const availabilityCalls: string[] = [];
      page.on("request", req => {
        if (
          req
            .url()
            .includes(
              `/modules/web_hosting/domains/availability/${exactDomain}`
            )
        ) {
          availabilityCalls.push(req.url());
        }
      });

      await dac.gotoSearch(exactDomain);

      await expect(dac.firstCard).toContainText(exactDomain);
      await expect(dac.firstCard).toContainText("£12.00");
      expect(availabilityCalls.length).toBeGreaterThan(0);
    });

    test("Searching for an unavailable domain shows it disabled, with no Add to basket button", async ({
      context
    }) => {
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(SLD) });
      mockDomainSuggestionsTlds(context, { products: domainProducts });
      mockDomainAvailability(context, {
        byDomain: {
          [exactDomain]: {
            can_register: false,
            can_transfer: false,
            is_premium: false
          }
        }
      });

      await dac.gotoSearch(exactDomain);

      await expect(dac.firstCard).toContainText(exactDomain);
      await expect(dac.addToBasketButtonOnCard()).toHaveCount(0);
    });

    test("If the availability check fails, the searched domain still appears (treated as unavailable)", async ({
      context
    }) => {
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(SLD) });
      mockDomainSuggestionsTlds(context, { products: domainProducts });
      mockDomainAvailability(context, { errorStatus: 500 });

      await dac.gotoSearch(exactDomain);
      await expect(dac.firstCard).toBeVisible();
    });

    test("Searching by name only (no TLD) does not trigger an availability check", async ({
      page,
      context
    }) => {
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(SLD) });
      mockDomainSuggestionsTlds(context, { products: domainProducts });

      const availabilityCalls: string[] = [];
      page.on("request", req => {
        if (req.url().includes("/domains/availability/")) {
          availabilityCalls.push(req.url());
        }
      });
      // /tlds resolving is the end-of-search signal — any /availability call
      // would have fired by then.
      const tldsResponse = page.waitForResponse(res =>
        res.url().includes("/modules/web_hosting/domains/suggestions/tlds")
      );

      await dac.gotoSearch(SLD);
      await tldsResponse;

      expect(availabilityCalls).toHaveLength(0);
    });
  });

  test.describe("Domain input sanitisation", () => {
    test.beforeEach(async ({ page, context }) => {
      await page.goto(URLs.baseUrl);
      await waitForSessionCookie(context, { guestOnly: true });
      const token = await getSessionToken(context);
      await interceptConfigValues(page, token, {
        domainSearchMethod: "smart-suggest"
      });
      mockDomainSuggestions(context, { rows: baselineSuggestionRows(SLD) });
      mockDomainSuggestionsTlds(context, { products: domainProducts });
      mockDomainAvailability(context, {
        default: {
          can_register: true,
          can_transfer: false,
          is_premium: false
        }
      });
    });

    const cases: ReadonlyArray<{
      name: string;
      raw: string;
      expected: string;
    }> = [
      {
        name: "Pasting a URL with https:// strips the protocol before searching",
        raw: "https://mydomain.com",
        expected: "mydomain"
      },
      {
        name: "`www.` prefix is stripped before searching",
        raw: "www.mydomain.com",
        expected: "mydomain"
      },
      {
        name: "Port, path, query and fragment are stripped before searching",
        raw: "mydomain.com:8080/path?q=1#frag",
        expected: "mydomain"
      },
      {
        name: "Invalid characters and spaces are stripped before searching",
        raw: "my domain!.com",
        expected: "mydomain"
      },
      {
        name: "Consecutive dots are collapsed before searching",
        raw: "..mydomain..com..",
        expected: "mydomain"
      }
    ];

    for (const { name, raw, expected } of cases) {
      test(name, async ({ page }) => {
        // Always-on listener attached BEFORE navigation captures every
        // /suggestions request synchronously into `queriesSeen`. The
        // assertion then just inspects the array — no risk of awaiting a
        // request that's already fired by the time `page.goto` resolves.
        const queriesSeen: string[] = [];
        page.on("request", req => {
          const url = req.url();
          if (
            !url.includes("/modules/web_hosting/domains/suggestions?") ||
            url.includes("/modules/web_hosting/domains/suggestions/tlds?")
          ) {
            return;
          }
          queriesSeen.push(new URL(url).searchParams.get("query") ?? "");
        });

        await dac.gotoSearch(raw);
        // Cards rendering proves /suggestions fired and resolved.
        await expect(dac.firstCard).toBeVisible();

        expect(queriesSeen[0]).toContain(expected);
      });
    }
  });
});
