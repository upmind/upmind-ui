// -----------------------------------------------------------------------------
/**
 * @module client-notifications/useClientNotifications.actions
 * @description Collection actions factory (refresh, readiness, lifecycle).
 * Query-backed — `destroy()` removes the registry entry; there is no service
 * to stop (`code-composables.md` Part B "TanStack Query variant").
 *
 * @doctrine clause 2 — shared-only (armless, §D10).
 */

import { watch } from "vue";
import { remove } from "../scope";
import { useActiveSession } from "../session-store";
import { isEmpty } from "lodash-es";
import type { NotificationsServices } from "./client-notifications.types";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------

type SettledQuery = {
  isFetched: { value: boolean };
  error: { value: unknown };
};

/**
 * Resolves once every given query has completed its first fetch — a
 * self-stopping `watch`, never a poll (defect F1, AC-11): the oracle's
 * `isReady()` runs an uncapped `setInterval`, a recorded stall class this
 * module does not port. `grep -rn "setInterval"` over this module must never
 * match.
 *
 * Resolves `!hasError`, not unconditional `true` (drift D23, `design.md`
 * §D18): TanStack sets `isFetched: true` on error too, so a readiness built on
 * `isFetched` alone lies — the oracle resolved `!hasError`
 * (`useNotifications.ts:49`).
 * @precedent `useClientPhones.actions.ts:78-99`'s `whenListFetched`.
 */
function whenAllFetched(queries: SettledQuery[]): Promise<boolean> {
  const settled = () => queries.every(query => query.isFetched.value);
  const hasError = () => queries.some(query => !isEmpty(query.error.value));

  if (settled()) return Promise.resolve(!hasError());

  return new Promise<boolean>(resolve => {
    const refs = queries.map(query => query.isFetched);
    const stop = watch(refs, () => {
      if (!settled()) return;
      stop();
      resolve(!hasError());
    });
  });
}

export function createClientNotificationsActions(
  _actorScope: ScopeActorTypes,
  service: NotificationsServices,
  topicsQuery: ReturnType<NotificationsServices["loadTopics"]>,
  channelsQuery: ReturnType<NotificationsServices["loadChannels"]>,
  optOutsQuery: ReturnType<NotificationsServices["loadOptOuts"]>,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  function destroy(): void {
    remove(scopeKey);
  }

  /**
   * This scope's settled addressability outcome, or `undefined` while the
   * session is still settling — reading the SAME `isAvailable` predicate
   * the reads' own `enabled`/`guard` call, so "ready to read" and "will ever
   * fetch" are the same question.
   * @precedent `useClientPhones.actions.ts`'s `addressableOutcome`.
   */
  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /**
   * Resolves the addressability outcome, waiting only while the session is
   * still settling — never forever: a client with no token and no session
   * settles `false` once the session store finishes initialising, rather
   * than never settling (drift D24, AC-11/AC-17).
   */
  function whenSessionSettles(): Promise<boolean> {
    const outcome = addressableOutcome();
    if (outcome !== undefined) return Promise.resolve(outcome);

    return new Promise<boolean>(resolve => {
      const stop = watch(
        [service.isAvailable, isSessionInitialised, isSessionSettling],
        () => {
          const settled = addressableOutcome();
          if (settled === undefined) return;
          stop();
          resolve(settled);
        }
      );
    });
  }

  /**
   * Resolves once the collection is ready to read: `false` immediately once
   * the scope settles as not addressable (drift D24), otherwise once all
   * three reads have completed their first fetch, `false` if any settled
   * with an error (drift D23).
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;
    return whenAllFetched([topicsQuery, channelsQuery, optOutsQuery]);
  }

  /** Refetches all three reads from the server. */
  async function refresh(): Promise<void> {
    await Promise.all([
      topicsQuery.refetch(),
      channelsQuery.refetch(),
      optOutsQuery.refetch()
    ]);
  }

  /**
   * Removes all three reads' cached data so an active surface returns to
   * pending and refetches. The forced-state arm hands this in as its cache
   * clear (`ForceReset` · `ScenarioPlayground.vue`): `refresh` refetches but
   * KEEPS the rows, so a forced `loading` never re-enters `isLoading` and a
   * forced failure draws over stale rows — only removal returns the surface to
   * the state the preset names.
   */
  async function reset(): Promise<void> {
    await Promise.all([
      topicsQuery.resetQuery(),
      channelsQuery.resetQuery(),
      optOutsQuery.resetQuery()
    ]);
  }

  // --- actor-specific actions: none earned (§D10 — actions: none).

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Resolves once the collection is ready to read. */
    isReady,

    /** Refetches the three reads from the server. */
    refresh,

    /** Removes the three reads' cached data so the surface refetches from scratch. */
    reset

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientNotificationsActions = ReturnType<
  typeof createClientNotificationsActions
>;
