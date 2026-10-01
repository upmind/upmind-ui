// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.withdraw-gate — the real cell after the balance
 * turned positive: payable commissions true, the withdraw-request config
 * also on, so the fully-positive cell is real and captured (@AC18)
 *
 * ## Job To Be Done
 * Characterise `canWithdraw`/`hasPayableCommissions` against the REAL,
 * unmodified recorded state of this brand and account, re-captured this
 * pass after the operator's 2026-09-30 staging change.
 *
 * ## Operator brief vs. the real capture — the contradiction is CLOSED
 * A prior pass reported the withdraw-request config key as unset
 * (`{"data": []}`) and named this NO-WITHDRAW-CONFIG-KEY. That was a fixture
 * bug, not the brand's real state: `affiliate.fixtures.ts` was sending the
 * `keys` parameter as the TypeScript enum MEMBER NAME
 * (`AFFILIATES_WITHDRAW_REQUEST`) instead of the real `BrandConfigKeys` wire
 * VALUE. Re-recorded with the real value
 * (`affiliate_systems.settings.withdraw_request`), the area capture now
 * answers `{"affiliate_systems.settings.withdraw_request": true}` — matching
 * the operator's 2026-09-30 brief exactly. Both terms of the AND are now
 * real and TRUE: `hasPayableCommissions` (£5.00 available) and the
 * withdraw-request setting. `canWithdraw` is asserted `true` below — the
 * fully-positive AC18 cell design.md named as uncapturable is now captured.
 *
 * ## What Breaks If These Fail
 * A client with money to withdraw would either wrongly see no request
 * control (this brand's real config gap), or a client with nothing
 * withdrawable would wrongly see one.
 *
 * ## ADR-035 (`code-tests.companion.md`: "never flip a value inside a
 * recording") — this is real, unmodified, freshly re-recorded data; no
 * value here is forced or overridden.
 *
 * ## A failure branch added this pass (match-scoped area failure, @AC18/AC25)
 * design.md §8.2 Failure surface, "the area settings read": `canWithdraw`
 * false, `isProgrammeEnabled` unchanged. `hasPayableCommissions` is derived
 * from the balance read alone (§8.4), so it stays true. `serveFailure`'s
 * `match` option scopes the 500 to the AREA `keys` value only, so the
 * `gate` key set and the balance read are unaffected — CONTROLS.md.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { BrandConfigKeys } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useClientAffiliate } from "../useClientAffiliate";
import { seedRealClient, serveFailure } from "./affiliate.int-helpers";

// -----------------------------------------------------------------------------

const AREA_ROUTE = "*/api/config/brand/values";
const AREA_KEYS = [
  BrandConfigKeys.AFFILIATES_DEFAULT_REDIRECT_LINK,
  BrandConfigKeys.AFFILIATES_WITHDRAW_REQUEST
].join(",");

describe("affiliate.withdraw-gate — a client with a payable balance and the brand's withdraw-request setting on can request a withdrawal", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("a client with a payable balance and the brand's withdraw-request config key on can request a withdrawal", async () => {
    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    // Real, freshly re-recorded state: the available balance is £5.00
    // (payable) and the withdraw-request config key is on — both terms of
    // the AND are real and true.
    expect(affiliate.useMeta().hasPayableCommissions.value).toBe(true);
    expect(affiliate.useMeta().canWithdraw.value).toBe(true);
  });

  it("a client with a payable balance cannot withdraw when the area settings read fails, even though the balance is still payable", async () => {
    // design.md §8.2 Failure surface, "the area settings read": "canWithdraw
    // is false ... isProgrammeEnabled does not change". `match` scopes the
    // failure to the AREA key set alone (design.md §8.1's `area` key set),
    // so the `gate` key set and the balance read fall through to their own
    // base captures, unaffected — never a blanket failure of the whole
    // `config/brand/values` route.
    serveFailure("get", AREA_ROUTE, 500, { match: { keys: AREA_KEYS } });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    // hasPayableCommissions is derived from the balance read alone (design.md
    // §8.4: "hasPayableCommissions is the legacy truthy test
    // !!balance.ALL.amount"), independent of the area settings read — the
    // real £5.00 balance stays payable even though the area read failed.
    expect(affiliate.useMeta().hasPayableCommissions.value).toBe(true);
    expect(affiliate.useMeta().canWithdraw.value).toBe(false);
  });
});
