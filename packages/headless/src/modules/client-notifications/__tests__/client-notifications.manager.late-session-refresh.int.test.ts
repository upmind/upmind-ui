// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — the late-session top-up
 * (integration, gap-closure: operator ruling (b) lifted)
 *
 * ## Job To Be Done
 * `useClientNotificationsManager.ts`'s construction-time top-up sends a root
 * `REFRESH` once the active session settles, to unblock a `client` scope
 * whose `hasSubscription` guard (`!!clientId || !!token`) was not yet
 * satisfied at construction time — the session may still be resolving a
 * client id. The fix guards that send on `stateMatches(actorRef.state,
 * "subscribing")` so the top-up only ever nudges a scope that is still
 * waiting, never one already settled. This proves the top-up's original
 * job survives the fix: a `client`-actor scope with no resolved identity at
 * construction is still unblocked once the session resolves a client id.
 *
 * ## What Breaks If These Fail
 * A scope constructed while the session is still restoring (a real app-boot
 * race, not a test artefact) gets permanently stuck in `subscribing` — the
 * editor never becomes usable even after the user is fully signed in.
 */

import { describe, expect, it } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  clientCredentials,
  installBackgroundStubs,
  installGatedGuestTokenStub,
  installNotificationsReadWriteHandlers,
  mapSessionUser,
  resetClientNotificationsScopes,
  useSessionStore
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** Polls the raw machine state until it matches, or the budget is spent. */
async function waitForRawState(
  manager: ReturnType<typeof useClientNotificationsManager>,
  matches: (value: unknown) => boolean,
  { timeoutMs, intervalMs }: { timeoutMs: number; intervalMs: number }
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (matches(manager.useInternals().state.value.value)) return true;
    if (Date.now() >= deadline) return false;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}

describe("The late-session top-up still unblocks a client scope with no resolved identity", () => {
  it("a client-actor scope with no clientId and no token reaches available once the session resolves with a real identity", async () => {
    resetClientNotificationsScopes();
    installBackgroundStubs();
    installNotificationsReadWriteHandlers(server);
    const gate = installGatedGuestTokenStub();

    void useSessionStore().initStore();
    const manager = useClientNotificationsManager().as("client");

    // Sanity: with the session bootstrap still gated and no identity of its
    // own, the scope does NOT settle within a short window — it is
    // genuinely stuck in `subscribing`, not merely slow.
    const settledEarly = await waitForRawState(
      manager,
      value => JSON.stringify(value).includes("available"),
      { timeoutMs: 300, intervalMs: 20 }
    );
    expect(
      settledEarly,
      "sanity: a scope with no clientId and no token must not settle before the session resolves"
    ).toBe(false);

    // The client identity resolves WHILE the session bootstrap is still
    // gated — the exact race the top-up exists to cover.
    const { clientToken, selfBody } = clientCredentials();
    await useSessionStore()
      .useActions()
      .add(clientToken, true, mapSessionUser(selfBody.data as never));

    gate.release();

    const settled = await waitForRawState(
      manager,
      value => JSON.stringify(value).includes("available"),
      { timeoutMs: 5000, intervalMs: 25 }
    );
    expect(
      settled,
      "the top-up never unblocked the scope once the session resolved"
    ).toBe(true);
    await expect(manager.useActions().isReady()).resolves.toBe(true);
  });
});
