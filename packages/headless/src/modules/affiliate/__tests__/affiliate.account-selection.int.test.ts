// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.account-selection — the resolver's server-inert
 * guard survives R-NO-SWITCH (@server)
 *
 * ## Job To Be Done
 * Protect the server-render guard only (design.md §8.4 "Server render"):
 * `isReady()` resolves at once, with no browser `window`, sending no
 * request. Operator ruling R-NO-SWITCH (2026-09-30) removed the resolver's
 * switch/select mechanics wholesale (AC26-AC33); this file's OTHER test
 * ("a client with exactly one affiliate account resolves it automatically")
 * asserted the OLD rule-1/select-call/`isSelectionNeeded` shape and is
 * deleted with it — the "one account, or `/self` account_id" account-source
 * capability R-NO-SWITCH keeps now has its own dedicated proof:
 * `affiliate.account-source.int.test.ts` (and `affiliate.feature`'s
 * `@account-source` scenarios).
 *
 * ## Carry-in fix applied (plan-carry-in.md B3, option 1 — real bootSession)
 * "build the Server scenario through bootSession, and stub window only
 * around the new-realm resolver build before start()." This spec now builds
 * a genuinely NEW JS realm via `bootSingleAccountSession()`
 * (`affiliate.int-helpers.ts`), the `freshImports()` precedent
 * (`session-store/__tests__/session-store.int.test.ts`): the current
 * realm's ONE real client session is seeded and persisted first, then
 * `vi.resetModules()` gives a fresh, uninitialised session store and a fresh
 * resolver module, so `storeReady` is genuinely `false` — not fabricated by
 * an un-awaited `clear()` on the shared realm. `window` is stubbed ONLY
 * around building the new-realm resolver, then restored before `start()`
 * kicks off the new realm's own `initStore()` (not awaited), reproducing the
 * exact server code path: the resolver's first call happens under
 * `window === undefined`. The order assertion below (`storeReady` still
 * `false` when the resolver's own `isReady()` resolves) is what the
 * `server-wait` mutant flips: under the mutant the resolver awaits the SAME
 * store-readiness promise, so by the time it resolves `storeReady` is
 * already `true`.
 *
 * ## Control (blind apply/run/revert)
 * `useAffiliateActiveAccount.server-wait.must-fail.patch` flips the
 * "Server render" test's `storeReady` assertion above from `false` to
 * `true`. Verification history: `__tests__/CONTROLS.md`.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  bootSingleAccountSession,
  seedRealClient
} from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("affiliate.account-selection — the resolver's server-inert guard survives R-NO-SWITCH", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("the resolver reports ready at once on the server, publishing no account and sending no request", async () => {
    const boot = await bootSingleAccountSession();

    let storeReady = false;
    void boot
      .useSessionStore()
      .useActions()
      .isReady()
      .then(() => {
        storeReady = true;
      });

    // Filters to the module's own paths (design.md §8.1: "A zero-request
    // assertion of this module counts the module paths only") — `start()`
    // triggers the session store's OWN restore read (`GET /api/self`),
    // which is not this module's path.
    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (path.includes("/accounts/") || path.includes("/affiliate")) {
        seen.push(request.url);
      }
    });

    try {
      vi.stubGlobal("window", undefined);
      const resolver = boot
        .useAffiliateActiveAccount()
        .as(ScopeActorTypes.CLIENT);
      const meta = resolver.useMeta();
      const actions = resolver.useActions();
      vi.unstubAllGlobals();

      // `start()` kicks off the session store's OWN restore — unrelated to
      // the resolver's no-window branch, and the session-store internals
      // read `window.location` directly (`useCookies`), so it runs with a
      // real `window` present, exactly as it did before this pass.
      boot.start();

      // `isReady()` is called HERE, with `window` re-stubbed undefined
      // immediately before it — the real server call site design.md §8.4
      // "Server render" describes. Restoring `window` before this call (as a
      // prior pass did, and left restored) never exercises the resolver's
      // own no-window branch at all; it only builds the composable under
      // the stub, then calls `isReady()` back in a normal browser-like
      // environment.
      vi.stubGlobal("window", undefined);
      await actions.isReady();

      expect(storeReady).toBe(false);
      expect(meta.isAvailable.value).toBe(false);
      expect(seen).toEqual([]);

      vi.unstubAllGlobals();

      // Let the store settle, then confirm the resolver still sent no
      // module-path request of its own — the server guard, not a race that
      // happened to resolve before the store did.
      await vi.waitFor(() => {
        expect(storeReady).toBe(true);
      });
      expect(seen).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
      boot.dispose();
    }
  });
});
