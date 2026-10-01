// -----------------------------------------------------------------------------
/**
 * @fileoverview useAffiliatePayoutDestinationManager — the payout manager
 * composable's ADR-021 unit-spec cases, promoted to integration (G11-EXEC,
 * review-notes.md 2026-09-29).
 *
 * ## Job To Be Done
 * Protect that the payout destination manager refuses a non-CLIENT scope
 * actor with no request (design.md §5.2, the CLIENT actor guard R-NO-SWITCH
 * keeps).
 *
 * ## What Breaks If These Fail
 * A STAFF actor could open the payout destination editor over a live client
 * session.
 *
 * ## Re-established this pass (review-notes.md pass-7, blocker 5)
 * The prior "an editor opened before the resolver publishes waits in
 * subscribing, then pins on the first published account" test held the
 * resolver's `POST /api/accounts/select` open with `holdCapture` to
 * deterministically delay account resolution. That select call no longer
 * exists, so R-NO-SWITCH's own pass deleted the test outright. The same
 * `bootFreshRealm` generalisation `useAffiliateLinkManager.int.test.ts` uses
 * to re-establish its own pin-on-open proof re-proves this composable's twin
 * case below — `useAffiliatePayoutDestinationManager.pin-on-open.must-fail.patch`
 * and `affiliate.active-account.default-subscription-payout.must-fail.patch`.
 *
 * ## Capture gap (honestly disclosed — not attempted here)
 * `useAffiliatePayoutDestinationManager.changed-never.must-fail.patch` needs
 * the published id to take a DIFFERENT value (NO-TWO-ACCOUNT). R-NO-SWITCH
 * (review-notes.md) removed account switching from this module entirely;
 * this gap is about the published id ever changing at all, not a
 * user-driven switch. It stays a named gap, escalated to the developer seat
 * to confirm whether the patch still targets a reachable code path or should
 * be retired (CONTROLS.md).
 * `useAffiliatePayoutDestinationManager.null-not-default.must-fail.patch`
 * needs a null `payoutDestinationId` inheriting the brand default — the real
 * account's own destination is never null (it is now PayPal,
 * `affiliate.destinations.int.test.ts`), so this pass does not attempt it
 * either; it stays a named gap.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own; `affiliate.destinations.int.test.ts`
 * and `affiliate.destination-save.int.test.ts` already own the read/save
 * surface.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import { bootFreshRealm, seedRealClient } from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("useAffiliatePayoutDestinationManager — a non-CLIENT scope actor is refused", () => {
  it("a STAFF actor gets isAvailable false and sends no request", async () => {
    await seedRealClient();
    const clientManager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await clientManager.useActions().isReady();

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (path.includes("/accounts/") || path.includes("/brands/")) {
        seen.push(`${request.method} ${path}`);
      }
    });

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.STAFF)
      .fresh();
    try {
      await manager.useActions().isReady();

      expect(manager.useMeta().isAvailable.value).toBe(false);
      expect(seen).toEqual([]);
    } finally {
      manager.useActions().destroy();
      clientManager.useActions().destroy();
    }
  });

  it("a fresh editor built before the session store settles waits with no ACCOUNT-scoped request, then pins the first-defined account", async () => {
    const boot = await bootFreshRealm();
    const payoutManagerModule = await boot.load(
      () => import("../useAffiliatePayoutDestinationManager")
    );

    const seenAccountRequests: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (path.includes("/accounts/") || path.includes("/brands/")) {
        seenAccountRequests.push(`${request.method} ${path}`);
      }
    });

    const manager = payoutManagerModule
      .useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      boot.start();

      // Built and read synchronously, before `start()`'s own `initStore()`
      // promise can have settled — the pin-on-open window.
      // `pin-on-open` reddens `accountId` here; `default-subscription-payout`
      // reddens `hasError`/`isLoading` here.
      expect(manager.useContext().accountId.value).toBeUndefined();
      expect(manager.useMeta().hasError.value).toBe(false);
      expect(manager.useMeta().isLoading.value).toBe(true);
      expect(seenAccountRequests).toEqual([]);

      await manager.useActions().isReady();

      expect(manager.useContext().accountId.value).toBeDefined();
      expect(seenAccountRequests.length).toBeGreaterThan(0);
    } finally {
      manager.useActions().destroy();
    }
  });
});
