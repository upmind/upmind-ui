// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.balance — two consumers share one balance read
 * (@AC3)
 *
 * ## Job To Be Done
 * Protect that the balance query key carries no per-instance segment
 * (design.md §8.11 `two-reads` control): two distinct `useClientAffiliate`
 * instances under the same account send exactly ONE balance GET between
 * them, and both publish the same real balance figures.
 *
 * ## What Breaks If These Fail
 * A page that opens `useClientAffiliate` twice (e.g. once for the header
 * balance chip, once for the withdrawal form) would double the balance
 * traffic — or worse, the two instances could disagree.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own — `affiliate.error-reload` and
 * `affiliate.withdraw-gate` prove the balance-read failure paths.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useClientAffiliate } from "../useClientAffiliate";
import { seedRealClient } from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

type BalanceBody = {
  data: {
    balance: { ALL: { amount_formatted: string } };
    withdrawn_balance: { ALL: { amount_formatted: string } };
    pending_balance: { ALL: { amount_formatted: string } };
  };
};

describe("affiliate.balance — two consumers share one balance read", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("two consumers share one balance read", async () => {
    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/balance")) {
        seen.push(`${url.pathname}${url.search}`);
      }
    });

    const first = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    const second = useClientAffiliate().as(ScopeActorTypes.CLIENT).fresh();

    expect(first).not.toBe(second);

    await Promise.all([
      first.useActions().isReady(),
      second.useActions().isReady()
    ]);

    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain("with_staged_imports=1");

    // Read from the recorded balance capture itself, never a hand-copied
    // literal — a re-record never silently drifts this spec stale.
    const balanceFixture = recorded<BalanceBody>(
      "get-accounts-id-affiliate-balance-with-staged-imports-1"
    );
    for (const instance of [first, second]) {
      expect(instance.useMeta().balanceAvailable.value).toBe(
        balanceFixture.data.balance.ALL.amount_formatted
      );
      expect(instance.useMeta().balancePending.value).toBe(
        balanceFixture.data.pending_balance.ALL.amount_formatted
      );
      expect(instance.useMeta().balanceWithdrawn.value).toBe(
        balanceFixture.data.withdrawn_balance.ALL.amount_formatted
      );
    }
  });
});
