// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — the late-session top-up must
 * not discard a TOKEN-BEARING scope's dirty draft (integration, AC-16
 * hardening)
 *
 * ## Job To Be Done
 * `useClientNotificationsManager.ts`'s construction-time top-up sends a root
 * `REFRESH` once the ambient session settles, guarded on
 * `stateMatches(actorRef.state, "subscribing")` so the top-up only ever
 * nudges a scope that is still waiting for its identity, never one already
 * settled. `hasSubscription` is `!!clientId || !!token` — a token-bearing
 * (link-following) scope satisfies it from construction and reaches `available` on
 * its own token alone. `clientId` itself is resolved by
 * `resolveClientId(scopeContext)`, which reads the SESSION's active actor,
 * not this scope's own actor — so an ambient session that resolves to a
 * signed-in CLIENT hands this link-scoped manager a truthy `clientId` too,
 * the moment its one-shot `ensureAuth().then()` settles. Deleting the
 * `subscribing` guard leaves the top-up firing unconditionally whenever
 * `clientId` resolves, landing on `available` and re-entering `loading` —
 * which discards a dirty draft.
 *
 * The ambient session's OWN `isReady()` is the one boundary held under
 * direct control here (`vi.spyOn`) — real wall-clock timing across the
 * session store's full bootstrap chain proved too nondeterministic to
 * reliably land the manager already dirty in `available` before the
 * session's `ensureAuth()` promise settles (observed: unrelated background
 * bootstrap traffic occasionally re-enters `loading` on its own, independent
 * of this guard, before the race window is reached). Controlling ONLY that
 * one promise's settle time — never the manager, the machine, the toggle, or
 * dirty-tracking, all of which are real — reproduces the exact ordering the
 * guard exists to survive, deterministically.
 *
 * ## What Breaks If These Fail
 * A client editing their notification preferences from an emailed link loses
 * an unsaved change the moment the browser's ambient session happens to
 * settle to a signed-in identity in the background — a real race, not a test
 * artefact, and silent: no error, no prompt, the draft is simply gone.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  clientCredentials,
  installNotificationsReadWriteHandlers,
  mapSessionUser,
  seedGuestFloor,
  useActiveSession,
  useSessionStore
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const LINK_TOKEN = "late-session-guard-token-scope";

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

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

describe("The late-session top-up must not discard a token-bearing scope's dirty draft", () => {
  it("a token-bearing scope already available and dirty survives a client identity resolving on the ambient session afterwards", async () => {
    await seedGuestFloor();
    installNotificationsReadWriteHandlers(server);

    // The ambient session's own `isReady()` is held pending under direct
    // control — see the file header's provenance note.
    const sessionReady = deferred<boolean>();
    const isReadySpy = vi
      .spyOn(useActiveSession().useActions(), "isReady")
      .mockReturnValue(sessionReady.promise);

    const manager = useClientNotificationsManager()
      .as("client")
      .withId(LINK_TOKEN);
    // Forces the scope's lazy construction NOW, while `ensureAuth()`
    // (the spied `isReady()`) is still pending — the machine's seed
    // captures `clientId: undefined` at this instant.
    manager.useInternals();

    const reachedAvailable = await waitForRawState(
      manager,
      value => JSON.stringify(value).includes("available"),
      { timeoutMs: 5000, intervalMs: 5 }
    );
    expect(
      reachedAvailable,
      "the token-bearing scope never reached available on its own token"
    ).toBe(true);

    const context = manager.useContext();
    const lockedTopicIds = new Set(
      context.lookups.value.topics
        .filter(topic => !topic.canOptOut)
        .map(topic => topic.id)
    );
    const openTopic = context.lookups.value.topics.find(
      topic => !lockedTopicIds.has(topic.id)
    );
    if (!openTopic) throw new Error("No opt-outable topic in the capture.");
    const anyChannel = context.lookups.value.channels[0];

    manager.useActions().toggle(openTopic.id, anyChannel.id);
    const becameDirty = await waitForRawState(
      manager,
      () => manager.useMeta().isDirty.value,
      { timeoutMs: 2000, intervalMs: 5 }
    );
    expect(becameDirty, "toggle() never made the draft dirty").toBe(true);
    const dirtyPreferences = {
      ...manager.useContext().model.value.preferences
    };

    // The ambient session resolves to a signed-in CLIENT identity, and ONLY
    // THEN does the held-pending `ensureAuth()` settle — the exact ordering
    // the `subscribing` guard exists to survive: the manager is already
    // dirty in `available` by the time the top-up's `.then()` runs.
    const { clientToken, selfBody } = clientCredentials();
    await useSessionStore()
      .useActions()
      .add(clientToken, true, mapSessionUser(selfBody.data as never));
    sessionReady.resolve(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    expect(
      manager.useMeta().isDirty.value,
      "the dirty draft was silently discarded by the late-session top-up"
    ).toBe(true);
    expect(manager.useContext().model.value.preferences).toEqual(
      dirtyPreferences
    );

    isReadySpy.mockRestore();
  });
});
