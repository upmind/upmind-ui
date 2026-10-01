// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.stats — the overview stats read from the account
 * and the balance (@AC6)
 *
 * ## Job To Be Done
 * Protect the six overview figures `useClientAffiliate` derives from the
 * account and balance reads — never from a separate `statistics` endpoint
 * (design.md §5.2, §8.1: this composable sends no such request).
 *
 * ## What Breaks If These Fail
 * A client's affiliate overview would show the wrong "affiliate since" date,
 * link visit count, referral count, or balance figures.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own — `affiliate.error-reload` proves the
 * account/balance-read failure paths this composable shares.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useClientAffiliate } from "../useClientAffiliate";
import { seedRealClient } from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

type RawAffiliateAccountBody = {
  data?: {
    created_at?: string;
    link_visit_count?: number;
    referral_count?: number;
  };
};
type RawAffiliateBalanceBody = {
  data?: {
    balance?: { ALL?: { amount_formatted?: string } };
    pending_balance?: { ALL?: { amount_formatted?: string } };
    withdrawn_balance?: { ALL?: { amount_formatted?: string } };
  };
};

describe("affiliate.stats — the overview stats read from the account and the balance", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("the overview stats read from the account and the balance", async () => {
    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      seen.push(new URL(request.url).pathname);
    });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    // Read from the recorded captures themselves — never a hand-copied
    // literal — so a re-record never silently drifts this spec stale.
    const account = recorded<RawAffiliateAccountBody>(
      "get-accounts-id-affiliate-with-staged-imports-1"
    ).data;
    const balance = recorded<RawAffiliateBalanceBody>(
      "get-accounts-id-affiliate-balance-with-staged-imports-1"
    ).data;

    const meta = affiliate.useMeta();
    expect(meta.affiliateSince.value).toBe(account?.created_at);
    expect(meta.linkVisitCount.value).toBe(account?.link_visit_count);
    expect(meta.referralCount.value).toBe(account?.referral_count);
    expect(meta.balanceAvailable.value).toBe(
      balance?.balance?.ALL?.amount_formatted
    );
    expect(meta.balancePending.value).toBe(
      balance?.pending_balance?.ALL?.amount_formatted
    );
    expect(meta.balanceWithdrawn.value).toBe(
      balance?.withdrawn_balance?.ALL?.amount_formatted
    );

    expect(seen.some(path => path.includes("statistics"))).toBe(false);
  });
});
