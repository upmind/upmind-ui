import { watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  ClientAddressListQuery,
  ClientAddressServices,
  SortModel
} from "./client-address.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-address/useClientAddresses.actions
 * @description Collection actions — row mutations, list controls and
 * lifecycle. Query-backed: `destroy()` removes the registry entry, because
 * there is no service to stop.
 *
 * Per-address FORM mutations are not here — `input` / `update` / `clear`
 * belong to `useClientAddressManager`, which owns the dirty/valid state they
 * need. `ensure` IS here — a collection action, not a form one:
 * `basket-billing/unified` and `client-company`'s find-or-create never open a
 * form (ruling R4 retires `useClientAddressServices`, and this is where its
 * callers land).
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useClientAddresses.actions.{actor}.ts` file exists.
 */

/**
 * The collection's readiness bound — the same ceiling the editor half uses.
 * A list that never arrives resolves `isReady()` FALSE rather than rejecting:
 * "not ready" is a settled answer for a collection, whereas the editor's
 * unfillable form is an error a consumer must be able to catch (`design.md`
 * D-10 / AC-4).
 */
const READINESS_TIMEOUT_MS = 15_000;

export function createClientAddressesActions(
  _actorScope: ScopeActorTypes,
  service: ClientAddressServices,
  query: ClientAddressListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling.
   *
   * Reading `service.isAvailable` — the same predicate the query's `enabled`
   * and `guard` call — makes "ready to read" and "will ever fetch" the same
   * question, so readiness cannot wait on a fetch that is not coming. This is
   * what closes the pre-conversion `setInterval(…, 100)` (`useClientAddresses.ts`
   * L42-51): uncapped, never cleared on the never-fetched path, and with no
   * rejection path at all (`parity.yaml` L6 / AC-4).
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
   * Resolves once the list query has completed its first fetch, or `false` at
   * {@link READINESS_TIMEOUT_MS} if it never does.
   *
   * The bound is the second half of `parity.yaml` L6 / AC-4: dropping the
   * pre-conversion `setInterval` removed the leaked timer, but a watcher on a
   * list that never arrives waits exactly as long as the interval did. A
   * readiness wait that cannot end is the defect, not the timer it used.
   */
  function whenListFetched(): Promise<boolean> {
    if (query.isFetched.value) return Promise.resolve(true);

    return new Promise<boolean>(resolve => {
      const timer = setTimeout(() => {
        stop();
        resolve(false);
      }, READINESS_TIMEOUT_MS);

      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        clearTimeout(timer);
        stop();
        resolve(true);
      });
    });
  }

  /**
   * Resolves once the collection is ready to read.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client or the list never arrives within
   * {@link READINESS_TIMEOUT_MS}.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenListFetched();
  }

  /**
   * Forces a re-read of the list from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    // TanStack's `refetch()` resolves with the error on the result rather than
    // rejecting, so a forced read has to be wrapped to reject at all.
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  // --- filters
  /**
   * Applies a free-text filter and re-issues the list request. Writes through
   * the collection's declared query CRITERIA — `filters.name.like` — rather
   * than a raw, undeclared filter object; the pre-M3 `query.filter(...)` call
   * this replaces named a method `ListQuery` never declared (dead since the
   * M2 → M3 upgrade wired `loadList()` through the criteria/schema channel;
   * see `client-address.services.ts`'s `loadList`).
   */
  function filterQuery(value?: string): void {
    query.setCriteria({ filters: { name: { like: value ?? null } } });
  }

  /**
   * @decision nested-filters-seam
   * what: `filters: { query: filterQuery }` stays NESTED rather than
   *   flattening to a bare `filterBy(intent)` matching `client-email`'s shape.
   * why: this is the module's ONE declared filter column (`name.like`), a raw
   *   string rather than a `FilterModel` intent object — `client-email`'s flat
   *   `filterBy(intent: FilterModel)` shape exists to dispatch AMONG several
   *   declared filter columns, a problem this module does not have.
   * rejected: a flat `filterBy(intent: FilterModel)` mirroring `client-email`
   *   exactly — would wrap the one raw string in an intent-object shape built
   *   to disambiguate among several filter columns, adopting `client-email`'s
   *   multi-filter shape onto a module with only one.
   */

  /**
   * Applies a sort INTENT — the `sort` branch of the one query model, so
   * `filters` and `pagination` are untouched. Mirrors `client-email`'s
   * `sortBy`.
   */
  function sortBy(intent: SortModel): void {
    query.setCriteria({ sort: intent });
  }

  /**
   * @decision setCriteria-mirrors-client-email-history
   * what: publishes `setCriteria: query.setCriteria` — the platform's
   *   generic, schema-governed write verb, merging any of `filters` / `sort`
   *   / `pagination` into the ONE query model — alongside the module's
   *   existing typed `filters.query` / `sortBy` adapters. This is the door a
   *   consumer calls to set the page size: `setCriteria({ pagination: {
   *   limit } })`.
   * why: `client-email` — the named oracle for this module's query layer —
   *   publishes NO page-window door at all: `nextPage`/`prevPage` move the
   *   query's OWN `pagination.offset`, but nothing sets `pagination.limit`,
   *   so with the schema's declared default staying `0` (deliberate — the
   *   billing surfaces and ten importers read the whole collection), the
   *   pager has no reachable path. `client-email-history` — same family,
   *   same declared `limit: 0`, same pager — is the real precedent: it
   *   already publishes this exact generic `setCriteria` door for the
   *   identical problem (`useClientReceivedEmailsActions.ts`).
   * rejected: a bespoke `setPageSize(limit, offset)` action — no oracle
   *   authorises inventing a shape when the platform already exposes a
   *   generic one (`query.setCriteria`) that a sibling module in this exact
   *   family already publishes verbatim.
   */

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.as()` mints a fresh collection.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useClientAddresses.actions.{actor}.ts` and spread it LAST so it wins:
  //   const actorActions =
  //     actorScope === ScopeActorTypes.STAFF
  //       ? createStaffClientAddressesActions(service)
  //       : {};
  // Never a `.base.ts` file; attach a `@decision` block adjacent to the spread
  // the day an arm overrides a shared member.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Finds an address by id, creating it only if absent. */
    ensure: service.ensure,

    /** Filters for the list query. */
    filters: {
      query: filterQuery
    },

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read. */
    isReady,

    /**
     * Fetches the next page of addresses. Wrapped in an `async` function —
     * the query platform's `fetchNextPage` throws SYNCHRONOUSLY when there is
     * no next page, and an `async` wrapper is what turns that throw into a
     * rejected promise, so a forced call always SETTLES instead of escaping as
     * an uncaught exception (AC-9).
     */
    nextPage: async (): Promise<void> => query.fetchNextPage(),

    /** Fetches the previous page of addresses. Same `async` wrapper as `nextPage`. */
    prevPage: async (): Promise<void> => query.fetchPreviousPage(),

    /** Refetches the list from the server; rejects if it cannot address one. */
    refresh,

    /**
     * Deletes an address. Failure is REPORTED to the user by the module
     * itself (operator ruling R10) and captured as state — the returned
     * promise settles either way, and the consumer acquires no feedback
     * obligation (AC-14, AC-40).
     */
    remove: service.remove,

    /**
     * Applies a criteria INTENT — merges the given `filters` / `sort` /
     * `pagination` branches into the ONE query model; branches left out are
     * untouched. The single generic write verb (see `@decision
     * setCriteria-mirrors-client-email-history` above): the schema governs
     * what is spellable, so a raw pagination literal is unreachable here.
     * This is the door that sets the page size:
     * `setCriteria({ pagination: { limit } })`.
     */
    setCriteria: query.setCriteria,

    /** Promotes an address to the client's default. Same feedback contract as `remove`. */
    setDefault: service.setDefault,

    /** Applies a sort intent — the `sort` branch of the one query model. */
    sortBy

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientAddressesActions = ReturnType<
  typeof createClientAddressesActions
>;
