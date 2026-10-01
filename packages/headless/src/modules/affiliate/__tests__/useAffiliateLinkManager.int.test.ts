// -----------------------------------------------------------------------------
/**
 * @fileoverview useAffiliateLinkManager — the link manager composable's
 * ADR-021 unit-spec cases, promoted to integration (G11-EXEC, review-notes.md
 * 2026-09-29).
 *
 * ## Job To Be Done
 * Protect that the link manager refuses a non-CLIENT scope actor with no
 * request (design.md §5.2, the CLIENT actor guard R-NO-SWITCH keeps).
 *
 * ## What Breaks If These Fail
 * A STAFF actor could open a link editor over a live client session.
 *
 * ## Re-established this pass (review-notes.md pass-7, blocker 5)
 * The prior "an editor opened before the resolver publishes waits in
 * subscribing, then pins on the first published account" test held the
 * resolver's `POST /api/accounts/select` open with `holdCapture` to
 * deterministically delay account resolution. That select call no longer
 * exists, so R-NO-SWITCH's own pass deleted the test outright rather than
 * guess a replacement delay. `affiliate.int-helpers.ts`'s `bootFreshRealm`
 * (authored for exactly this generalisation, per its own header) now gives
 * the SAME deterministic pre-ready window with no select call at all: a
 * genuinely-not-restored session store. The test below rebuilds the pin-on-
 * open proof on that window — `useAffiliateLinkManager.pin-on-open.must-fail.patch`
 * and `affiliate.active-account.default-subscription-link.must-fail.patch`
 * both target this same race, at two different layers (the manager's own
 * top-up watcher, and the manager config's default `hasSubscription`).
 *

 * ## Capture gap (NO-TWO-ACCOUNT, honestly disclosed — not attempted here)
 * `useAffiliateLinkManager.changed-never.must-fail.patch` needs the published
 * id to take a DIFFERENT value, so `isAccountChanged` can go from false to
 * true. No known staging credential has a second affiliate account
 * (`affiliate.int-helpers.ts`'s header). R-NO-SWITCH (review-notes.md)
 * removed account switching from this module entirely; this gap is about the
 * published id ever changing at all, not a user-driven switch. It stays a
 * named gap, escalated to the developer seat to confirm whether the patch
 * still targets a reachable code path or should be retired (CONTROLS.md).
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own; `affiliate.link-create.int.test.ts`
 * and `affiliate.link-edit.int.test.ts` already own the write surface.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { bootFreshRealm, seedRealClient } from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("useAffiliateLinkManager — a non-CLIENT scope actor is refused", () => {
  it("a STAFF actor gets isAvailable false and sends no request", async () => {
    await seedRealClient();
    // The resolver's own select call runs regardless of the manager's scope
    // actor (design.md §5.2: it reads the SESSION actor, which is CLIENT
    // here) — settle it first, or its promise resolves late into a LATER
    // test and republishes the shared `activeAccountId` ref past this test's
    // own `afterEach` teardown (pseudo-Nathan-style isolation hazard, the
    // exact one `affiliate.link-create.int.test.ts`'s header names).
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (path.includes("/accounts/") || path.endsWith("/self")) {
        seen.push(`${request.method} ${path}`);
      }
    });

    const manager = useAffiliateLinkManager().as(ScopeActorTypes.STAFF).fresh();
    try {
      await manager.useActions().isReady();

      expect(manager.useMeta().isAvailable.value).toBe(false);
      expect(seen).toEqual([]);
    } finally {
      manager.useActions().destroy();
    }
  });

  it("a create editor built before the session store settles waits with no ACCOUNT-scoped request, then pins the first-defined account", async () => {
    const boot = await bootFreshRealm();
    const linkManagerModule = await boot.load(
      () => import("../useAffiliateLinkManager")
    );

    // The manager's own self read (design.md §8.1, brandName) starts on open,
    // independent of the pin — only an `/accounts/...` request is gated on
    // the pin being defined, so only THAT is the pin-on-open assertion.
    const seenAccountRequests: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (path.includes("/accounts/")) {
        seenAccountRequests.push(`${request.method} ${path}`);
      }
    });

    const manager = linkManagerModule
      .useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      boot.start();

      // Built and read synchronously, before `start()`'s own `initStore()`
      // promise can have settled — the pin-on-open window. `pin-on-open`
      // reddens `accountId` here (it would already be defined, or undefined-
      // forever with no top-up); `default-subscription-link` reddens
      // `hasError`/`isLoading` here (it would reject before the wait, giving
      // `hasError` true and `isLoading` false).
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
