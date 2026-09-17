// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings — the B3 own-currency append (AC-24)
 *
 * ## Job To Be Done
 * Prove the discriminating half of AC-24 in ISOLATION: when the brand's own
 * currency list does NOT carry the account's own billing currency, that
 * currency is STILL offered — appended to the options so the client can see
 * and keep it. A client reads `useBillingSettings().currencyOptions` against a
 * REAL recorded brand list with the account's own currency filtered out, and
 * the account currency is present in the options only because the module
 * appended it.
 *
 * ## Why its OWN file (isolation, not ordering)
 * `useBrand().currencies` is a module-WIDE singleton: it fetches `brand/settings`
 * exactly once per test FILE and caches that list for the file's lifetime —
 * `queryClient.clear()` and `useBrand().refresh()` do NOT force a re-fetch. Any
 * sibling test that resolves the singleton against the FULL recorded list
 * (which DOES carry the account's own currency, GBP) would mask the append: the
 * account currency would then be present via the brand list, not the append,
 * and dropping the append would leave the suite green. A dedicated file gives
 * this arrangement a fresh singleton whose ONLY resolved brand list is the
 * omitting one, so the append is the sole path by which the account's own
 * currency can reach the options — the discriminating condition the colocated
 * `currency-options-own-missing.must-fail.patch` mutates.
 *
 * ## What Breaks If These Fail
 * A client whose account bills in a currency the brand's list happens not to
 * carry loses that currency from their options entirely — they can neither see
 * it nor keep it, and the editor offers no way back to their own billing
 * currency.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { useBillingSettings } from "..";
import { useBrand } from "../../brand";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  brandSettingsOmittingAccountCurrency,
  installBrandSettingsHandler,
  installSettingsGetHandler,
  recorded,
  resetClientBillingSettingsScopes,
  sessionStoreRecordingsDir,
  seedClientSession
} from "./client-billing-settings.int-helpers";
import { server } from "./setup.integration";
import type { Account } from "./client-billing-settings.int-helpers";

// -----------------------------------------------------------------------------

/** The session's own REAL, committed (masked) account — never a hardcoded value. */
function sessionAccount(): Account {
  const selfBody = getFixtureBody<{ data: { accounts: Account[] } }>(
    "get-self",
    { recordingsDir: sessionStoreRecordingsDir }
  );
  return selfBody.data.accounts[0];
}

/** The account's own currency filtered OUT of the real recorded brand list. */
function omittingBrandIds(accountCurrencyId: string): string[] {
  const omitting = brandSettingsOmittingAccountCurrency(accountCurrencyId);
  installBrandSettingsHandler(server, omitting);
  return omitting.data.currencies.map(currency => currency.id);
}

/**
 * Drive the module-wide `useBrand()` singleton to resolve the installed omitting
 * list, keeping the observer live across the poll — the singleton's one-shot
 * `brand/settings` fetch only fires once a subscriber reads its currencies, so
 * the read has to happen here, not before the composable exists.
 */
async function whenBrandListResolved(
  omittingIds: string[],
  accountCurrencyId: string
): Promise<void> {
  await vi.waitFor(
    () => {
      const brandIds = useBrand().currencies.value.map(c => c.id);
      expect(brandIds).toHaveLength(omittingIds.length);
      expect(brandIds).not.toContain(accountCurrencyId);
    },
    { timeout: 8000 }
  );
}

afterEach(() => {
  resetClientBillingSettingsScopes();
});

// -----------------------------------------------------------------------------

describe("useBillingSettings — the B3 own-currency append (AC-24)", () => {
  it("AC24 appends the account's own billing currency when the brand's list omits it", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());

    const account = sessionAccount();
    const omittingIds = omittingBrandIds(account.currency_id);
    expect(omittingIds).not.toContain(account.currency_id);

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await settings.useActions().isReady();
    await whenBrandListResolved(omittingIds, account.currency_id);

    const optionIds = settings
      .useContext()
      .currencyOptions.value.map(c => c.id);
    expect(optionIds).toContain(account.currency_id);
    expect(optionIds).toHaveLength(omittingIds.length + 1);
    expect(optionIds.filter(id => id === account.currency_id)).toHaveLength(1);

    settings.useActions().destroy();
  });

  it("AC24 places the appended own currency in its by-name sorted position, not tacked on the end", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());

    const account = sessionAccount();
    const omittingIds = omittingBrandIds(account.currency_id);

    const expectedOrder = [
      ...brandSettingsOmittingAccountCurrency(account.currency_id).data
        .currencies,
      account.currency
    ]
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map(currency => currency.id);

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await settings.useActions().isReady();
    await whenBrandListResolved(omittingIds, account.currency_id);

    expect(settings.useContext().currencyOptions.value.map(c => c.id)).toEqual(
      expectedOrder
    );

    settings.useActions().destroy();
  });
});
