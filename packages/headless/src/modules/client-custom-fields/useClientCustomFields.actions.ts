import { watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  ClientCustomFieldsListQuery,
  ClientCustomFieldsServices,
  CustomField,
  FilterModel,
  SortModel
} from "./client-custom-fields.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/useClientCustomFields.actions
 * @description Collection actions — readiness, refresh, filtering and
 * lifecycle.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useClientCustomFields.actions.{actor}.ts` exists.
 */
export function createClientCustomFieldsActions(
  _actorScope: ScopeActorTypes,
  service: ClientCustomFieldsServices,
  query: ClientCustomFieldsListQuery,
  scopeKey: string,
  narrowing: Ref<Partial<CustomField> | Partial<CustomField>[]>
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled SESSION-side outcome, or `undefined` while the
   * session is still settling (AC-6, JTBD-critical).
   *
   * `service.isAvailable` is deliberately NARROWER than the list query's own
   * `enabled`/`guard`: it only answers "can this scope address a client at
   * all" (session + client id), never "has the brand resolved" — the query
   * additionally gates on the brand read settling
   * (`client-custom-fields.services.ts`'s own `loadList`/`enabled`). Reading
   * `service.isAvailable` here bounds ONLY the session half of readiness; the
   * brand/query half is bounded separately, by `whenListFetched()` below
   * consuming the query's own `isFetched`/`error` — which itself only
   * settles because `enabled` fires once the brand read has SETTLED (success
   * OR failure), letting `guard` convert a failed or brand-less client into
   * the query's own rejection rather than a permanently-disabled entry.
   * Treating `isAvailable` as standing in for the full enabled predicate was
   * the AC-6 regression: a session that resolves fine but whose brand read
   * fails (401/500, or a client with no `brand_id`) left `enabled` false
   * forever, so `isFetched` never flipped and `isReady()` hung — fixed at the
   * query layer, not here, so this comment now describes what actually
   * bounds each half rather than asserting they were ever one predicate.
   *
   * This is the replacement for the uncapped 100ms `setInterval` that
   * resolved only on `meta.isAvailable`, never on error, never cleared.
   */
  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /**
   * Resolves the addressability outcome, waiting only while the session is
   * still settling. Self-stopping — no watcher survives past the first
   * settled outcome.
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
   * Resolves once the list query has completed its first fetch, folding in
   * the query's OWN error state so a failed definitions request (or a
   * failed brand resolution the query's `guard` rejects on) settles `false`
   * rather than hanging — the second half of AC-6.
   */
  function whenListFetched(): Promise<boolean> {
    if (query.isFetched.value) {
      return Promise.resolve(!query.error.value);
    }

    return new Promise<boolean>(resolve => {
      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        stop();
        resolve(!query.error.value);
      });
    });
  }

  /**
   * Resolves once the collection is ready to read.
   * @returns true once the first fetch has settled without error, false if
   * the session settles unaddressable OR the fetch itself errors. Never
   * hangs — both branches are bounded, self-stopping watches.
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
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /** Applies a server-side filter — reaches the wire as `filter[name|like]`. */
  function filterBy(intent: FilterModel): void {
    query.setCriteria({ filters: intent });
  }

  /** Re-orders the collection — reaches the wire as `order=`. */
  function sortBy(intent: SortModel): void {
    query.setCriteria({ sort: intent });
  }

  // --- client-side narrowing (AC-8)
  //
  // Deliberately NOT `query.filter()`: that mutates the query's own key and
  // re-fetches from the server. Legacy narrows the ALREADY-LOADED list
  // in-memory (`customFields.vue:204-215`) and issues no request; this
  // mirrors that by writing to a plain ref the context layer reads, never
  // touching `query`.

  /**
   * @decision widen `narrowBy` to accept `Partial<CustomField> | Partial<CustomField>[]`.
   * what:    the parameter widens from a single mapping to a single mapping OR
   *          an array of mappings. An array narrows to rows matching EVERY
   *          object in it (ANDed across the array; ANDed within each object
   *          by exact-equality-over-arbitrary-props, unchanged). A single
   *          mapping keeps its existing behaviour verbatim.
   * why:     legacy's `filters` prop is an ARRAY, not one mapping
   *          (`customFields.vue:183-186`), iterated with every object
   *          required to match (`:204-215`) — `_.map(this.filters, filter =>
   *          …)`. The headless surface was narrower than the oracle exhibits
   *          (parity row Q16 / ruling R3), and the JTBD names "full parity
   *          with legacy". The widening is additive and backward-compatible:
   *          the sole call site (`client-custom-fields.collection.int.test.ts:309`)
   *          passes one mapping and is unaffected. Closes the operator
   *          question in `docs/sdd/client-custom-fields-upgrade/review-notes.md`
   *          (conductor ruling) rather than leaving it open.
   * rejected: leaving the pre-existing single-mapping arity and filing the gap
   *          as `Dropped-with-Linear-issue` — rejected because the widening
   *          costs nothing (no production consumer to break) and closing a
   *          free gap beats tracking it.
   */
  function narrowBy(
    mapping: Partial<CustomField> | Partial<CustomField>[] = {}
  ): void {
    narrowing.value = mapping;
  }

  /**
   * @decision setCriteria-mirrors-client-address-precedent
   * what: publishes `setCriteria: query.setCriteria` — the platform's
   *   generic, schema-governed write verb, merging any of `filters` / `sort`
   *   / `pagination` into the ONE query model. This is the door a consumer
   *   calls to set the page size: `setCriteria({ pagination: { limit } })`,
   *   then drives `nextPage()` / `prevPage()`.
   * why: this module declares `pagination.limit` with `default: 0` (one
   *   unpaged read, deliberate — see `client-custom-fields.schemas.ts`'s
   *   own comment) and publishes `nextPage`/`prevPage`, but with no public
   *   door to set a page size the pager was inert — the exact gap this
   *   module's own prover named directly: "AC-34 paging structurally
   *   blocked by AC-33's mandatory `limit:0`". `client-email-history`
   *   publishes this same generic door for the identical problem, and
   *   `client-address` (`useClientAddresses.actions.ts`) already mirrors
   *   it — this is that same repair applied here.
   * rejected: a bespoke `setPageSize(limit, offset)` action — no oracle
   *   authorises inventing a shape when the platform already exposes a
   *   generic one (`query.setCriteria`) that sibling modules already
   *   publish verbatim.
   */

  /**
   * Destroys this scoped instance — removes it from the registry so the
   * next `.as()` mints a fresh collection.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2). When a scope
  // earns one, add `useClientCustomFields.actions.{actor}.ts` and spread it
  // LAST so it wins.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Applies a server-side filter — the `filters` branch of the query model. */
    filterBy,

    /**
     * Resolves with every dirty (pending-upload) IMAGE value in `model`
     * replaced by its uploaded hash — B's pre-save step (seam A-11).
     */
    flushImages: service.flushImages,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read. */
    isReady,

    /** Client-side property narrowing over the already-loaded list (AC-8). */
    narrowBy,

    /** Fetches the next page of definitions. */
    nextPage: query.fetchNextPage,

    /** Fetches the previous page of definitions. */
    prevPage: query.fetchPreviousPage,

    /** Refetches the list from the server; rejects if it cannot address one. */
    refresh,

    /**
     * Applies a criteria INTENT — merges the given `filters` / `sort` /
     * `pagination` branches into the ONE query model; branches left out are
     * untouched. See `@decision setCriteria-mirrors-client-address-precedent`
     * above. This is the door that sets the page size:
     * `setCriteria({ pagination: { limit } })`.
     */
    setCriteria: query.setCriteria,

    /** Re-orders the collection — the `sort` branch of the query model. */
    sortBy

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientCustomFieldsActions = ReturnType<
  typeof createClientCustomFieldsActions
>;
