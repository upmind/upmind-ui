// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications manager — the late-session top-up must
 * not discard a token-bearing scope's dirty draft, proven by MOCKING THE
 * SESSION-STORE MODULE rather than spying on one call's actions object
 * (integration, AC-16 hardening, round-3 finding B4)
 *
 * ## Job To Be Done
 * Three prior attempts at this read-back concluded the `subscribing` guard
 * in `useClientNotificationsManager.ts` was uncoverable. The reason: this
 * module's own `useActiveSession.ts:33` returns a FRESH `useActions()`
 * object on every call. A `vi.spyOn(useActiveSession().useActions(),
 * "isReady")` installs a spy on ONE throwaway instance; the manager's own
 * internal call to `useActiveSession().useActions()` mints a SEPARATE fresh
 * object the spy never touches, so the test passes identically whether the
 * `subscribing` guard is present OR deleted — it certifies nothing.
 * `client-notifications.manager.late-session-refresh-token-scope.int.test.ts`
 * carries exactly that shape; it is left in place (never weakened, never
 * deleted — a different seat's write), and THIS file is the read-back that
 * actually reaches the guard: `vi.mock` replaces the WHOLE session-store
 * module, so every caller — the test's own setup AND the manager's internal
 * top-up — receives the SAME overridden `isReady`, not one throwaway
 * instance's.
 *
 * This is the second time fresh-instance-per-call has hidden a defect in
 * this module — the first was `useActions()` minting a new debounce per
 * call, defeating `update()`'s flush.
 *
 * ## What Breaks If These Fail
 * A client editing their notification preferences from an emailed link loses
 * an unsaved change the moment the browser's ambient session happens to
 * resolve a signed-in identity in the background — silently, with no error
 * and no prompt. A test that only reads `isDirty` cannot catch a variant of
 * this where the flag survives but the draft's CONTENT is quietly wrong —
 * exactly the shape `client-notifications.manager.dirty-parity.int.test.ts`
 * exists to keep out of the save path; this file proves the same discipline
 * holds across the late-session race.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  clientCredentials,
  installNotificationsReadWriteHandlers,
  mapSessionUser,
  seedGuestFloor,
  useSessionStore
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// ---------------------------------------------------------------------------
// The module mock MUST replace the whole `session-store` module so every
// caller resolving it — this file's own setup AND
// `useClientNotificationsManager.ts`'s internal late-session top-up — reads
// the SAME overridden `isReady`, never a throwaway per-call instance.
// `isReadyControl` defaults to a transparent passthrough to the REAL
// `isReady`, so session bootstrap and every OTHER caller of `isReady()` are
// unaffected; only this file's own test installs a controlled override, and
// only for the duration of its own critical window. `vi.hoisted` is required
// because `vi.mock`'s factory is hoisted above every import — `isReadyControl`
// must exist before that hoisting point.
// ---------------------------------------------------------------------------
const isReadyControl = vi.hoisted(() =>
  vi.fn<Parameters<() => Promise<boolean>>, Promise<boolean> | undefined>(
    () => undefined
  )
);

vi.mock("../../session-store", async () => {
  const actual = await vi.importActual<typeof import("../../session-store")>(
    "../../session-store"
  );
  return {
    ...actual,
    useActiveSession: () => {
      const real = actual.useActiveSession();
      const realActions = real.useActions();
      return {
        ...real,
        useActions: () => ({
          ...realActions,
          isReady: (...args: unknown[]) => {
            const controlled = isReadyControl(
              ...(args as Parameters<typeof isReadyControl>)
            );
            return controlled ?? realActions.isReady();
          }
        })
      };
    }
  };
});

// -----------------------------------------------------------------------------

const LINK_TOKEN = "late-session-dirty-content-token";

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
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

beforeEach(() => {
  isReadyControl.mockReset();
  isReadyControl.mockReturnValue(undefined);
});

describe("A token-bearing scope's dirty draft content, not only its flag, survives the session resolving late", () => {
  it("a token-bearing scope's dirty draft content, not only its isDirty flag, survives the session resolving late", async () => {
    await seedGuestFloor();
    installNotificationsReadWriteHandlers(server);

    const sessionReady = deferred<boolean>();
    isReadyControl.mockReturnValue(sessionReady.promise);

    const manager = useClientNotificationsManager()
      .as("client")
      .withId(LINK_TOKEN);
    // Forces the scope's lazy construction NOW, while the mocked `isReady()`
    // is still pending — the machine's seed captures `clientId: undefined`
    // at this instant, exactly the ordering the `subscribing` guard exists
    // to survive.
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

    // The AMBIENT session resolves to a signed-in CLIENT identity, and ONLY
    // THEN does the mocked `isReady()` settle — the manager is already dirty
    // in `available` by the time the top-up's `.then()` runs.
    const { clientToken, selfBody } = clientCredentials();
    await useSessionStore()
      .useActions()
      .add(clientToken, true, mapSessionUser(selfBody.data as never));
    sessionReady.resolve(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    expect(
      manager.useMeta().isDirty.value,
      "the dirty draft's isDirty flag was silently discarded by the late-session top-up"
    ).toBe(true);
    expect(
      manager.useContext().model.value.preferences,
      "isDirty stayed true but the draft's CONTENT no longer matches what was actually changed — a stale-flag defect, not merely a wipe"
    ).toEqual(dirtyPreferences);
  });
});
