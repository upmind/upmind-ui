// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details editor — never-authenticated and
 * late-resolution boundaries (AC-42, AC-54)
 *
 * ## Job To Be Done
 * Isolated in its OWN file for a documented reason: session-store state
 * persists across `it()`s within one file even though the scope registry
 * resets between them (this module's own harness note, and
 * `client-email.int-helpers.ts`'s own precedent for
 * `seedAuthenticatedSessionWithoutClientId`). A "never/late authenticates"
 * assertion sharing a file with a test that calls `seedClientSession()` would
 * observe a session-store already primed by an earlier test, not a genuine
 * cold boot — exactly the contamination class this split avoids. NO test in
 * this file calls `seedClientSession()`.
 *
 * Proves: a rejected/never-settling session readiness surfaces as
 * `isReady() → false` with no unhandled rejection, and after `stop()` a late
 * session resolution sends nothing (AC-42); the machine holds in
 * `subscribing`, issuing zero requests, until a client id exists, then moves
 * to `loading` — for that reason alone — the moment one does (AC-54).
 *
 * ## What Breaks If These Fail
 * An editor that fires an unaddressed request on every construction (the
 * G-25 regression `requirements.md` AC-54 names, since the shared machine's
 * own `hasSubscription` guard defaults to unconditionally `true` if a
 * `withConfig` override ever stops binding), or a swallowed rejection that
 * leaves a consumer with no explanation.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
// Primed by import order (not mocked): see client-personal-details.read.int.test.ts's
// top-of-file note — the real session-store must resolve before this
// module's own barrel, or the transitive `../scope` walk re-enters itself
// mid-evaluation at `client-email/useClientEmails.ts:80`. Sorting this
// block alphabetically regresses the whole suite (module A's prover lost a
// cycle to exactly this).
// eslint-disable-next-line import/order
import {
  observeClientRequests,
  recorded,
  resolveClientIdOnActiveSession,
  seedAuthenticatedSessionWithoutClientId
} from "./client-personal-details.int-helpers";
import { usePersonalDetailsManager } from "..";
import { queryClient } from "../../query/client";
import { ScopeActorTypes } from "../../scope/scope.types";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("usePersonalDetailsManager — a failed sign-in check never leaves an unexplained error (AC-42)", () => {
  it("AC-42 resolves isReady() false and raises no unhandled rejection when the session never authenticates", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown): void => {
      unhandled.push(reason);
    };
    process.on("unhandledRejection", onUnhandled);

    try {
      const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);
      // The manager's own isReady() is bounded at 30s
      // (usePersonalDetailsManager.actions.ts — the readiness-infinity
      // mutant restores `timeout: Infinity` in this exact spot), so an
      // id that never arrives resolves false only once that bound elapses,
      // not immediately. The race timeout is set past it.
      const settled = await Promise.race([
        manager.useActions().isReady(),
        new Promise(resolve =>
          setTimeout(() => resolve("never-settled"), 32000)
        )
      ]);

      expect(settled).toBe(false);
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(unhandled).toEqual([]);
    } finally {
      process.removeListener("unhandledRejection", onUnhandled);
    }
  }, 40000);

  it("AC-42 sends nothing after stop() even when a session resolves late", async () => {
    await seedAuthenticatedSessionWithoutClientId();

    const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);
    manager.useActions().stop();

    const observed = observeClientRequests();
    await resolveClientIdOnActiveSession();
    await new Promise(resolve => setTimeout(resolve, 300));
    observed.stop();

    expect(observed.all()).toEqual([]);
  });
});

describe("usePersonalDetailsManager — the client-id gate holds until a client id exists (AC-54)", () => {
  it("AC-54 stays in 'subscribing' with zero requests, then moves to 'loading' and fires exactly once from its OWN read path the moment a client id arrives", async () => {
    // Amended (requirements.md, 2026-08-11): two identical
    // `GET clients/{id}` requests per boot are correct behaviour — a
    // sibling read path's own, independently-keyed query, not this
    // machine's. The count is scoped to THIS machine's own cache entry,
    // `["client", <id>, "record"]` (named verbatim in the amended AC text),
    // never to a raw count of every GET the wire happens to see for that
    // URL.
    await seedAuthenticatedSessionWithoutClientId();

    const observed = observeClientRequests();
    const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);

    await new Promise(resolve => setTimeout(resolve, 150));
    expect(manager.useInternals().state.value.matches("subscribing")).toBe(
      true
    );
    expect(observed.all()).toEqual([]);

    // Installed BEFORE the id resolves, keyed generically: the reactive
    // watch that lands the id on the machine can fire the GET before this
    // test's own next line would otherwise run, so a handler scoped to the
    // specific id installed AFTER resolving loses the race.
    server?.use(
      http.get("*/clients/*", () =>
        HttpResponse.json(recorded.profile(), { status: 200 })
      )
    );
    const { clientId } = await resolveClientIdOnActiveSession();

    await vi.waitFor(() =>
      expect(manager.useInternals().state.value.matches("subscribing")).toBe(
        false
      )
    );
    await vi.waitFor(() => {
      const ownRead = queryClient
        .getQueryCache()
        .find({ queryKey: ["client", clientId, "record"], exact: false });
      expect(ownRead?.state.dataUpdateCount).toBe(1);
    });
    observed.stop();
  });
});
