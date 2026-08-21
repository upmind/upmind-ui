import { nextTick, watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  ClientEmailHistoryServices,
  ReceivedEmailsListQuery,
  SentEmailFilterModel,
  SentEmailSortModel
} from "./client-email-history.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/useClientReceivedEmails.actions
 * @description Collection actions — list controls and lifecycle. Query-backed:
 * `destroy()` removes the registry entry, because there is no service to stop.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns ONLY
 * shared members; no `useClientReceivedEmails.actions.{actor}.ts` file exists.
 */
export function createClientReceivedEmailsActions(
  _actorScope: ScopeActorTypes,
  service: ClientEmailHistoryServices,
  query: ReceivedEmailsListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling.
   *
   * Gating on `isAuthenticated` alone is not enough: the list query is
   * enabled on the FULL addressability predicate, so a session that
   * authenticates without ever resolving a client id leaves the query
   * permanently disabled, and a readiness wait on its first fetch would
   * never settle. Reading `service.isAvailable` — the same predicate the
   * query's `enabled` and `guard` call — makes "ready to read" and "will
   * ever fetch" the same question.
   */
  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /**
   * Resolves the addressability outcome, waiting only while the session is
   * still settling.
   */
  function whenSessionSettles(): Promise<boolean> {
    const settled = addressableOutcome();
    if (settled !== undefined) return Promise.resolve(settled);

    return new Promise<boolean>(resolve => {
      const stop = watch(
        [service.isAvailable, isSessionInitialised, isSessionSettling],
        () => {
          const outcome = addressableOutcome();
          if (outcome === undefined) return;
          stop();
          resolve(outcome);
        }
      );
    });
  }

  /**
   * Resolves once the list query has completed its first fetch — for the
   * CURRENT filter/sort, not whatever key the observer was last attached to.
   *
   * A filter/sort mutation lands on `query`'s reactive key ref synchronously
   * (the `{ immediate: true }` tab watcher in `EmailHistoryListing.vue` runs
   * before this is ever awaited), but the underlying TanStack observer only
   * switches onto the new key on Vue's next reactive flush. Reading
   * `isFetched` before that flush sees the PREVIOUS key's already-settled
   * state — on a warm re-mount with a different tab, that is the previous
   * tab's rows. `nextTick()` waits for that flush to finish before the read.
   */
  async function whenFetched(): Promise<boolean> {
    await nextTick();

    if (query.isFetched.value) return true;

    return new Promise<boolean>(resolve => {
      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        stop();
        resolve(true);
      });
    });
  }

  /**
   * Resolves once the collection is ready to read.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client. Always SETTLES — replaces the
   * oracle's `setInterval` poll, which hangs a Suspense boundary forever
   * once the collection is gated.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenFetched();
  }

  /**
   * Forces a re-read of the list from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    // TanStack's `refetch()` resolves with the error on the result rather
    // than rejecting, so a forced read has to be wrapped to reject at all:
    // the pre-check leaves the request unfired, the result check catches a
    // session that died between the two.
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * Applies a filter INTENT — the `filters` branch of the one query model, so
   * `sort` and `pagination` are untouched by construction. A thin typed adapter
   * over {@link setCriteria}, so the platform table channel's `filterBy` resolves
   * to a real member; the free-text search binds `filters.subject.like`.
   */
  function filterBy(intent: SentEmailFilterModel): void {
    query.setCriteria({ filters: intent });
  }

  /**
   * Applies a sort INTENT — the `sort` branch of the one query model, so
   * `filters` and `pagination` are untouched. A thin typed adapter over
   * {@link setCriteria}, so the platform table channel's `sortBy` resolves to a
   * real member. A `[]` intent is compacted away and the parse refills the
   * schema's `default` order, so clearing the sort lands as the default rather
   * than an absent order.
   */
  function sortBy(intent: SentEmailSortModel): void {
    query.setCriteria({ sort: intent });
  }

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.as()` mints a fresh collection.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useClientReceivedEmails.actions.{actor}.ts` and spread it LAST so it
  // wins:
  //   const actorActions =
  //     actorScope === ScopeActorTypes.STAFF
  //       ? createStaffClientReceivedEmailsActions(service)
  //       : {};
  // Never a `.base.ts` file; attach a `@decision` block adjacent to the
  // spread the day an arm overrides a shared member.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Applies a filter intent to the list — merges the `filters` branch. */
    filterBy,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read. Always settles. */
    isReady,

    /** Fetches the next page of the history. */
    nextPage: query.fetchNextPage,

    /** Fetches the previous page of the history. */
    prevPage: query.fetchPreviousPage,

    /** Refetches the list from the server; rejects if it cannot address one. */
    refresh,

    /**
     * Applies a criteria INTENT — merges the given `filters` / `sort` /
     * `pagination` branches into the ONE query model; branches left out are
     * untouched. The single write verb: the schema governs what is spellable,
     * so a legacy `filter[col]` key or a raw sort tuple is unreachable here.
     */
    setCriteria: query.setCriteria,

    /** Applies a sort intent to the list — merges the `sort` branch. */
    sortBy

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientReceivedEmailsActions = ReturnType<
  typeof createClientReceivedEmailsActions
>;
