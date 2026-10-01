// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.error-reload — a failed read reports its error,
 * and a reload asks again (@AC25)
 *
 * ## Job To Be Done
 * Protect the 404-is-not-an-error suppression (design.md §8.5, §10.1 P3)
 * and the ordinary failure-state path a non-404 failure takes: an account
 * read failure sets `hasError`, a `refresh()` asks again, and — proven
 * against the REAL recorded not-enrolled account — a 404 on the account
 * read suppresses `hasError` (`isEnrolled` false, no error shown).
 *
 * ## Why the 404 halves below use a control response, not a recording
 * The account this unit records is ENROLLED on both
 * `GET accounts/{a}/affiliate` and `GET accounts/{a}/affiliate/balance` —
 * neither route has a real 404 to replay, and this unit holds no OTHER
 * staging account to record a not-enrolled 404 from without altering the
 * one shared client credential (barred by scope). So the "absent account"
 * and "account 404 bound" halves below use `serveFailure(..., 404)` — the
 * sanctioned control-response exemption from the recorded-only law
 * (`code-tests.companion.md`: "Control and error responses are exempt"),
 * the same mechanism every other failure branch in this unit already uses
 * for its 500 cases. This proves the module's 404-suppression LOGIC (the
 * account-read branch of design.md §6.1 step 5, §8.12 "Account 404"), not
 * the exact recorded staging error body — that distinction is the point of
 * this note, not silently glossed over. Authoring history:
 * `__tests__/CONTROLS.md`.
 *
 * ## Capture gap (G3, honestly disclosed)
 * The balance-404-bound scenario needs a real balance 404 on an enrolled
 * account with a not-enrolled balance side — this unit's one real account is
 * enrolled on both routes now, so there is no state left to record a
 * genuine balance-only-404 combination from. It stays `@todo` in
 * `affiliate.feature`, named there rather than silently dropped.
 *
 * ## Named gap — a real `default_redirect` value (honestly disclosed)
 * The recorded `area` key set capture carries no `default_redirect` value,
 * so `defaultRedirectUrl === ""` below cannot discriminate a genuinely-absent
 * setting from a wrong-key read. A real value needs the same
 * ARRANGE-RECORD-RESET staff write this file's sibling
 * `affiliate.programme-gate.int.test.ts` names as blocked by this story's
 * no-admin-paths run constraint. Stays `@todo` in `affiliate.feature`.
 *
 * ## Named gap — the balance-404-bound case (honestly disclosed)
 * design.md §8.5/bdd.md AC25 name a fourth failure case: the account read
 * succeeds and the balance read 404s on a not-enrolled balance side. This
 * unit's one real account is enrolled on both routes, so no real 404 exists
 * to replay there, and a control-response override cannot stand in for it —
 * a control proves the module's own failure-handling LOGIC, but this case's
 * whole point is the RESPONSE SHAPE of a genuine not-enrolled balance body,
 * which this unit holds no capture of. Stays `@todo` in `affiliate.feature`
 * (NO-BALANCE-404-CAPTURE, G3).
 *
 * ## Six AC25 scenarios (bdd.md), now complete across this file and its
 * siblings: the account-read failure and the balance-read failure (both
 * below, a control response per design.md §8.2), the account 404 bound
 * (below), the balance 404 bound (named gap above), the area settings bound
 * and the gate settings bound (both below, `match`-scoped per design.md
 * §8.1's `gate`/`area` key sets).
 *
 * Stated omissions (ADR-021, design.md §8.2): each failure this spec serves
 * is the declared control envelope of `serveFailure`, per the Failure
 * surface table of design.md §8.2.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { BrandConfigKeys } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useClientAffiliate } from "../useClientAffiliate";
import { seedRealClient, serveFailure } from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

const BRAND_CONFIG_ROUTE = "*/api/config/brand/values";
const AREA_KEYS = [
  BrandConfigKeys.AFFILIATES_DEFAULT_REDIRECT_LINK,
  BrandConfigKeys.AFFILIATES_WITHDRAW_REQUEST
].join(",");
// design.md §8.1 row "Programme gate settings": "keys
// UPMIND_AFFILIATES_ENABLED, UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED" —
// that literal order, not the enum's own declaration order.
const GATE_KEYS = [
  BrandConfigKeys.UPMIND_AFFILIATES_ENABLED,
  BrandConfigKeys.UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED
].join(",");

type RawAffiliateAccountBody = { data?: { id?: string } };
type BalanceBody = {
  data: {
    balance: { ALL: { amount_formatted: string } };
    withdrawn_balance: { ALL: { amount_formatted: string } };
    pending_balance: { ALL: { amount_formatted: string } };
  };
};

describe("affiliate.error-reload — a failed read reports its error, and a reload asks again", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("a failed read reports its error, and a reload asks again", async () => {
    serveFailure("get", "*/api/accounts/:id/affiliate", 500);

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    expect(affiliate.useMeta().hasError.value).toBe(true);

    // Start the counter only after the failed first read has settled, and
    // match the exact account path — not `/affiliate/balance` or any other
    // sibling route — so a query-core retry on the first 500 can never
    // inflate this count.
    let accountRequests = 0;
    server?.events.on("request:start", ({ request }) => {
      if (/\/affiliate$/.test(new URL(request.url).pathname)) {
        accountRequests += 1;
      }
    });

    await affiliate.useActions().refresh();

    expect(accountRequests).toBe(1);
  });

  it("a failed balance read reports its error, and a reload asks again", async () => {
    // design.md §8.2 Failure surface, "account and balance reads": a 500
    // override on the balance route, the same control mechanism the
    // account-read-failure case above uses — no real capture needed.
    serveFailure("get", "*/api/accounts/:id/affiliate/balance", 500);

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    expect(affiliate.useMeta().hasError.value).toBe(true);

    let balanceRequests = 0;
    server?.events.on("request:start", ({ request }) => {
      if (/\/affiliate\/balance$/.test(new URL(request.url).pathname)) {
        balanceRequests += 1;
      }
    });

    await affiliate.useActions().refresh();

    expect(balanceRequests).toBe(1);
  });

  it("an absent affiliate account is not an error — a 404 control response (no real 404 capture on this enrolled account)", async () => {
    serveFailure("get", "*/api/accounts/:id/affiliate", 404);

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    expect(affiliate.useMeta().isEnrolled.value).toBe(false);
    expect(affiliate.useMeta().hasError.value).toBe(false);
  });

  it("a client's programme status and account are unaffected when the area settings read fails", async () => {
    // design.md §8.9: the gate key set and the area key set share one route,
    // `config/brand/values`, distinguished only by the `keys` query
    // parameter. `serveFailure` with no `match` fails EVERY request on this
    // route, including the gate read — so it cannot prove the gate/area
    // independence this test names; it can only prove "some read failed".
    // Scoped to the real, recorded area `keys` value (§8.1: the area key
    // set is `AFFILIATES_DEFAULT_REDIRECT_LINK`, `AFFILIATES_WITHDRAW_REQUEST`)
    // so the gate request, the account read and the balance read all fall
    // through to their own base captures, unaffected (bdd.md AC25 "Area
    // settings bound").
    serveFailure("get", BRAND_CONFIG_ROUTE, 500, {
      match: { keys: AREA_KEYS }
    });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    expect(affiliate.useMeta().isEnrolled.value).toBe(true);
    expect(affiliate.useMeta().hasError.value).toBe(false);

    // The account read is unaffected by the area-key failure — read from the
    // recorded capture itself, never a hand-copied literal.
    const raw = recorded<RawAffiliateAccountBody>(
      "get-accounts-id-affiliate-with-staged-imports-1"
    ).data;
    expect(affiliate.useContext().data.value?.id).toBe(raw?.id);

    // Read from the recorded balance capture itself, never a hand-copied
    // literal (affiliate.balance.int.test.ts's own read does the same) —
    // the balance read is unaffected by the area-key failure either.
    const balanceFixture = recorded<BalanceBody>(
      "get-accounts-id-affiliate-balance-with-staged-imports-1"
    );
    expect(affiliate.useMeta().balanceAvailable.value).toBe(
      balanceFixture.data.balance.ALL.amount_formatted
    );
    expect(affiliate.useMeta().balancePending.value).toBe(
      balanceFixture.data.pending_balance.ALL.amount_formatted
    );
    expect(affiliate.useMeta().balanceWithdrawn.value).toBe(
      balanceFixture.data.withdrawn_balance.ALL.amount_formatted
    );

    expect(affiliate.useMeta().canWithdraw.value).toBe(false);
    expect(affiliate.useContext().defaultRedirectUrl.value).toBe("");
    // Real, re-recorded gate capture (both keys ON, `affiliate.fixtures.ts`'s
    // config-key fix) — the gate members are independent of the AREA read,
    // which this test fails on purpose. A mutant tying `isProgrammeEnabled`
    // to the area settings' presence would flip this to `false` when the
    // area read fails; the real, un-tied gate stays whatever the gate read
    // alone says (the `gate-from-area` control reddens this assertion).
    expect(affiliate.useMeta().isProgrammeEnabled.value).toBe(true);
  });

  it("a client sees the programme as unavailable when the gate settings read fails", async () => {
    // design.md §8.2 Failure surface, "the gate settings read": scoped to
    // the real, recorded gate `keys` value (§8.1), so the area key set falls
    // through to its own base capture, unaffected (bdd.md AC25 "Gate
    // settings bound").
    serveFailure("get", BRAND_CONFIG_ROUTE, 500, {
      match: { keys: GATE_KEYS }
    });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    expect(affiliate.useMeta().hasError.value).toBe(false);
    expect(affiliate.useMeta().isProgrammeEnabled.value).toBe(false);
    // The mirror discriminator to the AREA-bound test's `canWithdraw` `false`
    // assertion above: the real area capture has `withdraw_request` on and
    // the recorded balance is payable, so a gate-read failure that left the
    // area settings unaffected reports `canWithdraw` `true`. A mutant tying
    // `canWithdraw` to the gate read's presence (rather than the area read
    // and the balance alone) would flip this to `false`.
    expect(affiliate.useMeta().canWithdraw.value).toBe(true);
    // Named gap (this file's own header, "a real `default_redirect` value"):
    // the recorded area capture carries no `default_redirect` value, so this
    // stays `""` rather than a real configured default (design.md §8.12).
    expect(affiliate.useContext().defaultRedirectUrl.value).toBe("");
  });
});
