import { nextTick, ref, watch } from "vue";
import { SentEmailStatus } from "@upmind-automation/types";
import { invalidateQueryByKey, RequestSortDirection } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { ReceivedEmailsSortableProperties } from "./client-email-history.types";
import { NotAuthenticatedError } from "../../utils";
import { assign, isEmpty } from "lodash-es";
import type {
  ClientEmailHistoryServices,
  ReceivedEmailsListQuery
} from "./client-email-history.types";
import type { RequestFilters } from "../query";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ISentEmail } from "@upmind-automation/types";
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

  // --- sort

  /**
   * Sorts the history by the given property and direction. With no property,
   * clears back to the module's default order — `query.sort()` with no
   * argument clears the sort ref to `undefined`, which drops the `order`
   * param from the wire entirely, so the default tuple is re-applied
   * explicitly rather than relied on as a fallback.
   */
  function sort(
    property?: ReceivedEmailsSortableProperties,
    direction?: RequestSortDirection
  ): void {
    if (!property || isEmpty(property)) {
      query.sort([
        RequestSortDirection.DESC,
        ReceivedEmailsSortableProperties.DEFAULT
      ]);
    } else {
      query.sort([direction ?? RequestSortDirection.ASC, property]);
    }
  }

  // --- filters — one applied ref backs all three, so they compose rather
  // than clobber.
  const filters = ref<RequestFilters & { query?: string; subject?: string }>(
    {}
  );

  /** Applies a free-text filter and re-issues the list request. */
  function filterQuery(value?: string): void {
    filters.value = { ...filters.value, query: value };
    query.filter(filters.value);
  }

  /** Applies a subject filter and re-issues the list request. */
  function filterSubject(value?: ISentEmail["subject"]): void {
    filters.value = { ...filters.value, subject: value };
    query.filter(filters.value);
  }

  /**
   * Narrows the history to one delivery outcome, or clears the narrowing —
   * the four tabs (Research R2), re-expressed as a runtime action because
   * `createScopedComposable` hands the factory no consumer-parameter
   * channel. The wire keys/values are carried over verbatim from
   * `EmailHistory.vue` — `"true"` / `"false"` / `"null"` are strings there.
   */
  function filterStatus(status?: SentEmailStatus): void {
    // The three tab keys move as a SET, and stay PRESENT (never omitted)
    // with an explicit `undefined` when not applicable — AC-8's bug was
    // omitting a no-longer-applicable key from the filters object entirely.
    // `request()` only `.set()`s or `.delete()`s the keys it iterates on a
    // given call, over the CURRENT filters object's own keys, against a
    // single URL instance reused across every request for this query's
    // lifetime; a key missing from the object is never visited, so it never
    // gets `.delete()`d off that reused URL and lingers on the wire.
    const next: RequestFilters & { query?: string; subject?: string } = {
      ...filters.value,
      "filter[sent]": undefined,
      "filter[bounced]": undefined,
      "filter[error_id|neq]": undefined
    };

    if (status === SentEmailStatus.SENT) {
      assign(next, { "filter[sent]": "true", "filter[bounced]": "false" });
    } else if (status === SentEmailStatus.BOUNCED) {
      assign(next, { "filter[bounced]": "true" });
    } else if (status === SentEmailStatus.ERROR) {
      assign(next, { "filter[error_id|neq]": "null" });
    }

    filters.value = next;
    query.filter(filters.value);
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

    /** Filters for the list query. */
    filters: {
      query: filterQuery,
      subject: filterSubject,
      status: filterStatus
    },

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

    /** Sorts the history by the given property and direction. */
    sort

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientReceivedEmailsActions = ReturnType<
  typeof createClientReceivedEmailsActions
>;
