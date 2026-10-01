// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.collections — the four collections' ADR-021
 * unit-spec scope-actor case, promoted to integration (G11-EXEC,
 * review-notes.md 2026-09-29), looped over the three collections
 * `affiliate.cell-boundary.int.test.ts` does not already drive.
 *
 * ## Job To Be Done
 * Protect that `useAffiliateReferrals`, `useAffiliateCommissions` and
 * `useAffiliatePayouts` each refuse a non-CLIENT scope actor with
 * `isAvailable` false and zero requests, over the SAME real client session —
 * design.md §5.2's scope-actor check applies to every one of the nine
 * composables, but `affiliate.cell-boundary.int.test.ts`'s matrix loop only
 * drives `useClientAffiliate`, `useAffiliateLinks` and both managers. These
 * three collections shared this gap until now.
 *
 * ## What Breaks If These Fail
 * A STAFF or GUEST actor over a live client session could read this client's
 * referral, commission or payout history — an on-behalf capability the
 * oracle never grants (parity.yaml: client×self and guest×self only).
 *
 * ## Capture gap (NO-TWO-ACCOUNT, honestly disclosed — not attempted here)
 * `affiliate.collections.keep-any-rows.must-fail.patch` targets the
 * account-bound `placeholderData` function keeping rows once the published
 * account id becomes a DIFFERENT id — it needs Seed 2A/A2, a client session
 * with TWO affiliate accounts. No known staging credential has one
 * (`affiliate.int-helpers.ts`'s header). R-NO-SWITCH (review-notes.md)
 * removed account switching from this module entirely; this gap is about
 * the published id ever taking a second value at all, not a user-driven
 * switch. It stays a named gap, escalated to the developer seat to confirm
 * whether the patch still targets a reachable code path or should be retired
 * (CONTROLS.md); this file proves the scope-actor case only, which is the
 * one ADR-021 case this unit's real capture can prove.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch; each collection's own read/failure surface is
 * proven by its own AC-anchored spec (`affiliate.referrals-list`,
 * `affiliate.commissions-list`, `affiliate.payouts-list`).
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateCommissions } from "../useAffiliateCommissions";
import { useAffiliatePayouts } from "../useAffiliatePayouts";
import { useAffiliateReferrals } from "../useAffiliateReferrals";
import { seedRealClient } from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

function isModulePath(path: string): boolean {
  return path.includes("/accounts/") && path.includes("/affiliate");
}

describe("affiliate.collections — a non-CLIENT scope actor gets isAvailable false and sends zero requests, over a real client session", () => {
  it("useAffiliateReferrals, useAffiliateCommissions and useAffiliatePayouts each refuse STAFF and GUEST", async () => {
    await seedRealClient();

    for (const actor of [ScopeActorTypes.STAFF, ScopeActorTypes.GUEST]) {
      const seen: string[] = [];
      const listener = ({ request }: { request: Request }): void => {
        const path = new URL(request.url).pathname;
        if (isModulePath(path)) seen.push(`${request.method} ${path}`);
      };
      server?.events.on("request:start", listener);

      const referrals = useAffiliateReferrals().as(actor);
      const commissions = useAffiliateCommissions().as(actor);
      const payouts = useAffiliatePayouts().as(actor);

      await Promise.all([
        referrals.useActions().isReady(),
        commissions.useActions().isReady(),
        payouts.useActions().isReady()
      ]);

      expect(referrals.useMeta().isAvailable.value, actor).toBe(false);
      expect(commissions.useMeta().isAvailable.value, actor).toBe(false);
      expect(payouts.useMeta().isAvailable.value, actor).toBe(false);
      expect(seen, actor).toEqual([]);

      server?.events.removeListener("request:start", listener);
    }
  });
});
