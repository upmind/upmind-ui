// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.boot-order — a collection sends no request before
 * the session store settles (F-2, generalised past R-NO-SWITCH)
 *
 * ## Job To Be Done
 * Protect the page-mount-order invariant `bootFreshRealm`
 * (`affiliate.int-helpers.ts`) exists to prove: a collection that mounts
 * WHILE the session store is still restoring sends zero requests until the
 * store — and with it, the account source — settles. Account switching's
 * `holdCapture`-on-`accounts/select` mechanism is removed with R-NO-SWITCH,
 * but the underlying race (a page can build a collection before its account
 * resolves) still exists on ANY session-store boot, switch mechanism or not —
 * `bootFreshRealm`'s own header names this exact generalisation. This file
 * is the proof that helper was authored for and, until now, had no
 * consuming test.
 *
 * ## What Breaks If These Fail
 * A page that mounts a listing before the session store restores from
 * storage could send a request with no account segment, or race an
 * `isAvailable` flip mid-render.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own.
 */
import { describe, expect, it, vi } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { bootFreshRealm } from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("affiliate.boot-order — a collection sends no request before the session store settles", () => {
  it("a collection built before the session store settles sends no request until it does", async () => {
    const boot = await bootFreshRealm();
    const linksModule = await boot.load(() => import("../useAffiliateLinks"));

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (path.includes("/accounts/") || path.includes("/affiliate")) {
        seen.push(path);
      }
    });

    let storeReady = false;
    void boot
      .useSessionStore()
      .useActions()
      .isReady()
      .then(() => {
        storeReady = true;
      });

    const links = linksModule.useAffiliateLinks().as(ScopeActorTypes.CLIENT);

    boot.start();

    // Built and read synchronously, before `start()`'s own `initStore()`
    // promise can have settled — the exact window a page-mount race opens.
    expect(storeReady).toBe(false);
    expect(links.useMeta().isAvailable.value).toBe(false);
    expect(seen).toEqual([]);

    // `isReady()` can settle immediately while the account is still
    // unresolved (an unavailable collection is, itself, "ready" with no
    // rows) — so the store's own readiness, not this call, is the signal to
    // wait on before checking whether the collection caught up.
    await links.useActions().isReady();
    await vi.waitFor(() => {
      expect(storeReady).toBe(true);
    });
    await links.useActions().isReady();

    expect(seen.length).toBeGreaterThan(0);
  });
});
