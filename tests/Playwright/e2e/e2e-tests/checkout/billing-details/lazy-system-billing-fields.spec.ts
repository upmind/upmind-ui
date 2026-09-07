import { test } from "@playwright/test";
import { newUser, expect } from "../../../support/fixtures/auth-context";
import { products } from "../../../support/constants/products";
import { Countries } from "../../../support/constants/countries";
import { URLs } from "../../../support/constants/urls";
import { goToCheckout } from "../../../support/flows/checkout";
import { registerClientViaHeadless } from "../../../support/flows/auth-setup";
import { interceptConfigValues } from "../../../support/mocks/brand";
import { Checkout } from "../../../support/page-objects/templates/checkout";

/**
 * Job To Be Done (FE-2789 / FE-1698)
 * ----------------------------------
 * FE-1698 stopped fetching countries, regions and billing cycles eagerly on
 * cart boot; they are now loaded on demand behind `ensureCountries()` /
 * `ensureBillingCycles()`. The prefetch-timing and call-count guarantees are
 * proven at the integration layer. What only e2e can prove is that the
 * user-visible *populate* still happens once the deferred load resolves — the
 * address country/region dropdowns fill, the region list re-derives when the
 * country changes, and the phone dialling-code list is present and choosable.
 *
 * Spec: tests/features/checkout/lazy-system-billing-fields.feature
 * (@layer-e2e @FE-2789). One Scenario → one test; the test title is the
 * Scenario name verbatim.
 *
 * Assertions are locale-safe by design: they read selection state
 * (`data-state="checked"`) and stable option keys (`data-test-value`), never a
 * translated country/region label — the FE-2840 locale trap.
 */

newUser.describe("FE-2789: lazily-loaded billing fields populate", () => {
  // Test 3 registers an interceptConfigValues route; clear routes between tests
  // so a mock can never bleed into another test on a reused context (C12).
  newUser.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  newUser(
    "A chosen address suggestion populates the country and region",
    async ({ page, checkout }) => {
      // Given — a fresh customer at checkout, adding a new billing address. A
      // client with no saved details is shown the entry form directly
      // (CheckoutBilling.vue) — there is no summary to change from.
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await expect(checkout.billingCards).toBeVisible({ timeout: 15000 });

      // When — they choose a suggested address from the autocomplete results.
      // `selectAddressFromSearch` drives the real Google Places lookup and picks
      // the suggestion, exactly as the sibling update-billing-details spec does.
      await checkout.selectAddressFromSearch(
        "10 Downing St, Westminster, London SW1A 2AA, UK",
        "10 Downing Street, Downing Street, London SW1A 2AA, UK"
      );

      // Control-flow guard: the place lookup resolves asynchronously and merges
      // the whole parsed address (country + region + city) in one update. Wait
      // for the parsed city to land before reading the country/region selects,
      // so the assertions don't race the deferred parse.
      await expect(checkout.city).not.toHaveValue("", { timeout: 15000 });

      // Then — the country for that address is shown as selected. Opening the
      // <Select> and asserting exactly one option is `checked` proves a value is
      // held without coupling to the translated country label.
      await checkout.openAddressCountry();
      await expect(checkout.selectedSelectOption).toHaveCount(1);
      await checkout.dismissSelect();

      // And — the region for that address is shown as populated (the Google
      // parse resolved a region id and the lazily-loaded region list carries it).
      await checkout.openAddressRegion();
      await expect(checkout.selectedSelectOption).toHaveCount(1);
      await checkout.dismissSelect();
    }
  );

  newUser(
    "Changing the country re-derives the available regions",
    async ({ page, checkout }) => {
      // Given — a fresh customer adding a new billing address (the entry form
      // is what a client without saved details sees)
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await expect(checkout.billingCards).toBeVisible({ timeout: 15000 });

      // When — the country dropdown has finished loading its options.
      await checkout.openAddressCountry();

      // Then — the country dropdown offers a list of countries to choose from
      // (proves `ensureCountries()` populated the control after the lazy load —
      // the core FE-1698 promise).
      const countryKeys = await checkout.selectOptionKeys();
      expect(countryKeys.length).toBeGreaterThan(1);

      // And — choosing one country then a different country re-derives the
      // region options for the new country. Pick the UK first (known to expose
      // regions), select one of its regions, then switch to a second country
      // that is also known to expose regions (the US) and confirm the region
      // list re-derived off the newly-chosen country.
      await checkout.chooseSelectOption(Countries.UK);
      // Reveal the detail fields (region lives inside the manual-entry form).
      await checkout.addressManualEntry.click();

      await checkout.openAddressRegion();
      const ukRegionKeys = await checkout.selectOptionKeys();
      expect(ukRegionKeys.length).toBeGreaterThan(0);
      await checkout.chooseSelectOption(ukRegionKeys[0]);

      // Switch to the US — a country that also carries its own regions.
      await checkout.openAddressCountry();
      await checkout.chooseSelectOption(Countries.US);

      // Then — the region list re-derives for the newly-chosen country. Open
      // the region <Select> (which waits for its options) and assert the list
      // is non-empty AND wholly disjoint from the UK set. Region ids are
      // country-scoped, so a genuinely re-derived US list can share no key with
      // the UK list; a cascade bug that left a stale UK region behind would
      // surface here as an overlap. Poll while the <Select> stays open so the
      // check converges on the re-derived list rather than racing the async
      // reload.
      await checkout.openAddressRegion();
      await expect
        .poll(
          async () => {
            const usRegionKeys = await checkout.selectOptionKeys();
            return (
              usRegionKeys.length > 0 &&
              usRegionKeys.every(key => !ukRegionKeys.includes(key))
            );
          },
          { timeout: 15000 }
        )
        .toBe(true);
      await checkout.dismissSelect();
    }
  );
});

// Brand config is static and persisted from the first boot
// (brand.services.ts:119-121 since 16a5d5d9e9), so the phone requirement must
// be armed BEFORE the app loads — plain `test` plus an explicit boot + register
// rather than the `newUser` fixture, which boots first.
test.describe("FE-2789: lazily-loaded billing fields populate — phone", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  test("The phone dialling-code selector is populated and choosable", async ({
    page
  }) => {
    const checkout = new Checkout(page);
    // Given — a fresh customer whose brand requires a phone number, so the
    // billing form renders the phone field with its dialling-code selector.
    await interceptConfigValues(page, {
      requireAddressForOrders: true,
      requireCompanyForOrders: false,
      requireRegionInAddress: false,
      requirePhoneForOrders: true
    });
    await page.goto(URLs.baseUrl);
    await registerClientViaHeadless(page);
    await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
    await expect(checkout.billingCards).toBeVisible({ timeout: 15000 });
    // Control-flow guard: the phone field is part of the same add-details form.
    await expect(checkout.phone).toBeVisible({ timeout: 15000 });

    // When — they open the phone country selector.
    await checkout.openPhoneCountry();

    // Then — a list of dialling codes is shown.
    expect(await checkout.phoneDialCodeOptions.count()).toBeGreaterThan(10);

    // And — a dialling code can be chosen from the list: choosing one commits
    // the selection and closes the popover.
    await checkout.phoneDialCodeOptions.first().click();
    await expect(checkout.phoneCountryPopover).toBeHidden();
  });
});
