// -----------------------------------------------------------------------------
/**
 * @fileoverview useClientAffiliate — the account composable's ADR-021
 * unit-spec cases, promoted to integration (G11-EXEC, review-notes.md
 * 2026-09-29).
 *
 * ## Job To Be Done
 * Protect two `isEnrolled`/`isReady()` edges design.md §8.9 "Unit specs of
 * ADR-021" names, that no other spec in this unit proves today: `isEnrolled`
 * stays false when a published account's own read comes back 404 (the
 * empty-data half of the id-AND-data test — design.md §8.11 "Why the
 * `isEnrolled` control targets the data term"), and `isReady()` awaits the
 * resolver rather than resolving `false` at once when called before the
 * resolver has published (re-established via `bootFreshRealm`, review-notes.md
 * pass-7 blocker 5 — see the second `describe` block below).
 *
 * ## What Breaks If These Fail
 * A client whose account read races a 404 would wrongly show as enrolled
 * with no data, or a consumer that calls `isReady()` immediately on mount
 * would wrongly conclude the affiliate area has nothing to show before the
 * resolver ever got a chance to publish an account.
 *
 * ## Real capture used
 * The real enrolled `self`/account/balance captures of this unit
 * (`affiliate.int-helpers.ts`). The 404 in the first case is a CONTROL
 * response (`serveFailure`, status 404) — code-tests.companion.md: "Control
 * and error responses are exempt" from the recorded-only law — never a
 * hand-authored 200 body standing in for the not-enrolled account this unit
 * cannot record (NO-TWO-ACCOUNT).
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec's only failure case
 * is the 404 control of the first test; `affiliate.error-reload.int.test.ts`
 * already owns the 5xx failure surface for this composable's reads.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useClientAffiliate } from "../useClientAffiliate";
import {
  bootFreshRealm,
  recordedAccountId,
  seedRealClient,
  serveFailure
} from "./affiliate.int-helpers";
import { recorded } from "./setup.integration";

// -----------------------------------------------------------------------------

// `@workspace/no-cross-package-path-imports` bars a relative path reaching
// across a package boundary — `packages/i18n` publishes no subpath specifier
// for its locale source JSON. `readFileSync(join(...))` is the sibling
// pattern this repo already uses for the SAME class of file
// (`client-company.manager.int.test.ts`), resolved off `import.meta.dirname`
// — never `process.cwd()`, which breaks if vitest runs from a cwd other than
// `packages/headless` (pseudo-Nathan review pass 20). A scratch probe this
// pass confirmed `import.meta.dirname` resolves a real, correct absolute path
// in this exact happy-dom integration project; only the OTHER construction,
// `new URL(relative, import.meta.url).pathname`, is the broken one
// `setup.integration.ts`'s own `recordingsDir` comment names.
const textEn = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "../../../../../i18n/src/core/text-en.json"),
    "utf-8"
  )
) as Record<string, string>;

const ACCOUNT_ROUTE = "*/api/accounts/:accountId/affiliate";

type BalanceBody = {
  data: { balance: { ALL: { amount_formatted: string } } };
};

describe("useClientAffiliate — isEnrolled needs BOTH the id and the data", () => {
  it("isEnrolled stays false when the account read returns 404, despite a published account id", async () => {
    await seedRealClient();
    serveFailure("get", ACCOUNT_ROUTE, 404);

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    // Pin that the resolver's id is genuinely published — a mutant that
    // never publishes any id would also leave `isEnrolled` false and stay
    // green on the two lines below alone.
    expect(
      useAffiliateActiveAccount().as(ScopeActorTypes.CLIENT).useContext()
        .activeAccountId.value
    ).toBe(recordedAccountId());
    expect(affiliate.useMeta().isEnrolled.value).toBe(false);
    expect(affiliate.useMeta().hasError.value).toBe(false);
  });
});

// Re-established this pass (review-notes.md pass-7, blocker 5): the prior
// "isReady() called before the resolver has published" test held the
// resolver's `POST /api/accounts/select` open with `holdCapture` to
// deterministically reproduce a pre-publish boot race. Operator ruling
// R-NO-SWITCH (2026-09-30) removes that select call entirely, so R-NO-SWITCH
// deleted the test outright rather than guess a replacement race.
// `affiliate.int-helpers.ts`'s `bootFreshRealm` gives the same deterministic
// pre-ready window with no select call — a genuinely-not-restored session
// store — and lets this proof stand on the PROMISE's own settlement timing,
// never a held network response.
describe("useClientAffiliate — isReady() awaits the resolver rather than resolving at once", () => {
  it("isReady() called before the resolver has published stays pending until the session store settles", async () => {
    const boot = await bootFreshRealm();
    const clientAffiliateModule = await boot.load(
      () => import("../useClientAffiliate")
    );

    const affiliate = clientAffiliateModule
      .useClientAffiliate()
      .as(ScopeActorTypes.CLIENT);

    let settled = false;
    const readyPromise = affiliate
      .useActions()
      .isReady()
      .then(value => {
        settled = true;
        return value;
      });

    // One microtask hop, no `start()` yet — a mutant that resolves `false`
    // at once (design.md §8.5 step 1's guard, never entered here because the
    // scope actor genuinely IS client) settles within this same hop. The
    // real implementation awaits the resolver's own `isReady()`, which in
    // turn awaits the session store's async boot — many hops away.
    await Promise.resolve();
    expect(settled).toBe(false);

    boot.start();

    const result = await readyPromise;
    expect(settled).toBe(true);
    expect(result).toBe(true);
  });
});

// design.md §5.1 `withdrawalDefaults({ amount })`, §8.5: the withdrawal
// form's prefilled `message` is a REAL i18n translation of
// `text.affiliate_withdraw_balance`, filled with the recorded available
// balance — never the bare i18n key. `setup.integration.ts`'s own `beforeAll`
// already calls `useI18n().init(...)` with `packages/i18n/src/core/text-en.json`
// loaded under the `text` namespace (design.md §8.9 "Locale"), so `t()`
// resolves a real string here, not the identity-stub bare key.
describe("useClientAffiliate — the withdrawal form's prefilled message is a real translation", () => {
  it("withdrawal.defaults.message is the translated text.affiliate_withdraw_balance string, filled with the recorded available balance", async () => {
    await seedRealClient();

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    const balanceFixture = recorded<BalanceBody>(
      "get-accounts-id-affiliate-balance-with-staged-imports-1"
    );
    const availableAmount = balanceFixture.data.balance.ALL.amount_formatted;

    // Read from the REAL `text-en.json` `affiliate_withdraw_balance` template
    // (the same file `setup.integration.ts` loads under the `text`
    // namespace) and fill its own `{amount}` placeholder (design.md §5.1)
    // with the SAME recorded figure `affiliate.balance.int.test.ts` derives —
    // never a hand-typed copy of the sentence. A mutant that drops the
    // `text.` prefix (the i18n-namespace control) leaves `t()` unable to
    // resolve the key, so the bare, untranslated key string would surface
    // here instead of this real, filled-in sentence.
    const expectedMessage = textEn.affiliate_withdraw_balance.replace(
      "{amount}",
      availableAmount
    );
    expect(affiliate.useContext().withdrawal.defaults.value.message).toBe(
      expectedMessage
    );
  });
});
