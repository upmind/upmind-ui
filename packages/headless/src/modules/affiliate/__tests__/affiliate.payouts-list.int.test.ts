// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.payouts-list — the payouts read for the active
 * account (@AC20 read/failure half; AC21's filter/sort/paginate half stays
 * `@todo` in affiliate.feature — this account carries exactly 1 real row,
 * matching the operator brief's one withdrawn payout; no real page boundary
 * to prove; see the module hand-off)
 *
 * ## Job To Be Done
 * Protect that `useAffiliatePayouts` reads the active account's own payouts,
 * with the documented relations on the wire (design.md §8.1), and maps the
 * mapped rows through the same field map `affiliate.mappers.test.ts` proves
 * at the unit layer.
 *
 * ## What Breaks If These Fail
 * A client would see the wrong (or no) payout history, or a transient API
 * failure would look like "you have never been paid".
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec's failure case is the
 * documented 500-only 4xx/5xx surface for the four listing reads — no other
 * 4xx is a module code path for a read with no body.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliatePayouts } from "../useAffiliatePayouts";
import {
  recordedAccountId,
  seedRealClient,
  serveFailure
} from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

const PAYOUTS_ROUTE = "*/api/accounts/:accountId/affiliate/payouts";
const PAYOUTS_FIXTURE =
  "get-accounts-id-affiliate-payouts-with-staged-imports-1";

type PayoutsBody = { data?: { id?: string; amount_formatted?: string }[] };

function recordedPayoutRow(): { id?: string; amount_formatted?: string } {
  const row = recorded<PayoutsBody>(PAYOUTS_FIXTURE).data?.[0];
  if (!row)
    throw new Error(
      "[affiliate.payouts-list] recorded payouts capture carries no row."
    );
  return row;
}

describe("affiliate.payouts-list — the payouts read for the active account", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("reads the active account's own payouts, with with_staged_imports=1 on the wire, mapped to AffiliatePayoutRow", async () => {
    // The resolver must publish the active account BEFORE this collection is
    // built (design.md §8.4 Consumers) — see `affiliate.no-account`.
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/payouts")) {
        seen.push(`${url.pathname}${url.search}`);
      }
    });

    const accountId = recordedAccountId();
    const payouts = useAffiliatePayouts().as(ScopeActorTypes.CLIENT);
    await payouts.useActions().isReady();

    // Read from the recorded payouts capture itself, never a hand-copied
    // literal — the same row `affiliate.mappers.test.ts` proves at the unit
    // layer.
    const recordedRow = recordedPayoutRow();
    const rows = payouts.useContext().data.value;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(recordedRow.id);
    expect(rows[0].amount).toBe(5);
    expect(rows[0].amountFormatted).toBe(recordedRow.amount_formatted);
    expect(rows[0].success).toBe(true);
    expect(rows[0].destinationName).toBe("Wallet");

    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain(`/accounts/${accountId}/affiliate/payouts`);
    expect(seen[0]).toContain("with_staged_imports=1");
    for (const relation of ["affiliate_payout_destination", "payment_log"]) {
      expect(seen[0]).toContain(relation);
    }
  });

  it("reports a failed payouts read, and a refresh asks again", async () => {
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
    serveFailure("get", PAYOUTS_ROUTE);

    const payouts = useAffiliatePayouts().as(ScopeActorTypes.CLIENT);
    await payouts.useActions().isReady();

    expect(payouts.useMeta().hasError.value).toBe(true);
    expect(payouts.useContext().error.value).toBeTruthy();
    expect(payouts.useContext().data.value).toEqual([]);

    // Remove the failure override before the refresh — bdd.md AC20 asks a
    // refresh again, of the real read, not of the same forced failure.
    server?.resetHandlers();

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/payouts")) seen.push(url.pathname);
    });

    await payouts.useActions().refresh();

    expect(seen).toHaveLength(1);
    expect(payouts.useMeta().hasError.value).toBe(false);
    expect(payouts.useContext().data.value).toHaveLength(1);
  });
});

// The page-mount-order race (F-2) is proven generically, over
// useAffiliateLinks, by affiliate.boot-order.int.test.ts's own
// bootFreshRealm scenario — not restated here.
