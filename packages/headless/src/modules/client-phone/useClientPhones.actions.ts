import { watch } from "vue";
import { invalidateQueryByKey } from "../query";
// Deep path, never the `../scope` barrel — see useClientPhones.ts for the
// aggregator-barrel `export *` hazard this sidesteps.
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  ClientPhoneListQuery,
  ClientPhoneServices,
  FilterModel,
  SortModel
} from "./client-phone.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-phone/useClientPhones.actions
 * @description Collection actions — row mutations, list controls and
 * lifecycle. Query-backed: `destroy()` removes the registry entry, because
 * there is no service to stop.
 *
 * Per-phone FORM mutations are not here — `add` / `update` / `validate`
 * belong to `useClientPhoneManager`, which owns the dirty/valid state they
 * need.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns ONLY
 * shared members; no `useClientPhones.actions.{actor}.ts` file exists.
 */
export function createClientPhonesActions(
  _actorScope: ScopeActorTypes,
  service: ClientPhoneServices,
  query: ClientPhoneListQuery,
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
   * permanently disabled, and a readiness wait on its first fetch would never
   * settle. Reading `service.isAvailable` — the same predicate the query's
   * `enabled` and `guard` call — makes "ready to read" and "will ever fetch"
   * the same question.
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

  /** Resolves once the list query has completed its first fetch. */
  function whenListFetched(): Promise<boolean> {
    if (query.isFetched.value) return Promise.resolve(true);

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
   * settles without an addressable client.
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
    // TanStack's `refetch()` resolves with the error on the result rather
    // than rejecting, so a forced read has to be wrapped to reject at all.
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * Applies a filter INTENT — the `filters` branch of the one query model, so
   * `sort` and `pagination` are untouched by construction. The free-text
   * search binds `filters.number.like`.
   */
  function filterBy(intent: FilterModel): void {
    query.setCriteria({ filters: intent });
  }

  /**
   * Applies a sort INTENT — the `sort` branch of the one query model, so
   * `filters` and `pagination` are untouched. A `[]` intent is compacted away
   * and the parse refills the schema's `default` order, so clearing the sort
   * lands as the default rather than an absent order.
   */
  function sortBy(intent: SortModel): void {
    query.setCriteria({ sort: intent });
  }

  /**
   * @decision setCriteria-mirrors-client-address-precedent
   * what: publishes `setCriteria: query.setCriteria` — the platform's
   *   generic, schema-governed write verb, merging any of `filters` / `sort`
   *   / `pagination` into the ONE query model. This is the door a consumer
   *   calls to set the page size: `setCriteria({ pagination: { limit } })`,
   *   then drives `nextPage()` / `prevPage()`.
   * why: this module declares `pagination.limit` with `default: 0` (one
   *   unpaged read, deliberate — ~10 legacy importers read the whole
   *   collection) and publishes `nextPage`/`prevPage`, but with no public
   *   door to set a page size the pager was inert (the same shape as the
   *   client-custom-fields gap: AC-33's mandatory `limit:0` structurally
   *   blocks paging). `client-email-history` publishes this same generic
   *   door for the identical problem, and `client-address`
   *   (`useClientAddresses.actions.ts`) already mirrors it — this is that
   *   same repair applied here.
   * rejected: a bespoke `setPageSize(limit, offset)` action — no oracle
   *   authorises inventing a shape when the platform already exposes a
   *   generic one (`query.setCriteria`) that sibling modules already
   *   publish verbatim.
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
  // `useClientPhones.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /**
     * @scenario-include
     */
    destroy,

    /**
     * @scenario-include
     */
    ensure: service.ensure,

    /**
     * @scenario-include
     */
    filterBy,

    /**
     * @scenario-exclude internal cache-key invalidation, not a user-facing capability
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /**
     * @scenario-include
     */
    isReady,

    /**
     * @scenario-include
     */
    nextPage: query.fetchNextPage,

    /**
     * @scenario-include
     */
    prevPage: query.fetchPreviousPage,

    /**
     * @scenario-include
     */
    refresh,

    /**
     * @scenario-include
     */
    remove: service.remove,

    /**
     * Applies a criteria INTENT — merges the given `filters` / `sort` /
     * `pagination` branches into the ONE query model; branches left out are
     * untouched. See `@decision setCriteria-mirrors-client-address-precedent`
     * above. This is the door that sets the page size:
     * `setCriteria({ pagination: { limit } })`.
     * @scenario-include
     */
    setCriteria: query.setCriteria,

    /**
     * @scenario-include
     */
    setDefault: service.setDefault,

    /**
     * @scenario-include
     */
    sortBy

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
  };
}

// Type export for consumers
export type UseClientPhonesActions = ReturnType<
  typeof createClientPhonesActions
>;
