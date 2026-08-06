import { computed, ref } from "vue";
import { createScopedComposable } from "../scope";
import {
  DEFAULT_SORT,
  acceptOrRetain,
  assertSortFloor,
  pruneQuery,
  useQuerySchema
} from "./client-email.schemas";
import createClientEmailServices from "./client-email.services";
import { createClientEmailsActions } from "./useClientEmails.actions";
import { createClientEmailsContext } from "./useClientEmails.context";
import { createClientEmailsInternals } from "./useClientEmails.internals";
import { createClientEmailsMeta } from "./useClientEmails.meta";
import type { ClientEmailsScopeMatrix, QueryModel } from "./client-email.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails
 * @description Scoped, query-backed collection of a client's email addresses:
 * one TanStack list query per concrete `(actor, context)` scope, minted once at
 * construction so it survives component lifecycles. Its sibling is
 * `useClientEmailManager` — a second scoped composable in the same module,
 * registered under the SAME module name; the composable name and the scope key
 * carry the differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientEmailsForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createClientEmailServices(actorScope, config.context);

  /**
   * ONE query model per scope (S-D9): the user's INTENT in a ref, and a derived
   * read-only model — prune → validate → the value the wire is derived from.
   * `assertSortFloor` re-asserts the schema's forced fields before validation,
   * and `acceptOrRetain` retains the last-valid model on failure so an invalid
   * intent never reaches the wire (an unknown filter column is an HTTP 500).
   */
  const querySchema = useQuerySchema();
  const queryIntent = ref<QueryModel>({ filters: {}, sort: DEFAULT_SORT });
  // Self-referencing computed: `queryModel` is passed as its own `current`. The
  // first evaluation is always valid (the default model), so `current.value` is
  // never read before the computed has a cached value; only an invalid later
  // intent reads it, by which point the prior valid model is cached. Fragile by
  // construction — the design (§1.3) mandates one model, one retain seam.
  const queryModel: ComputedRef<QueryModel> = computed(() =>
    acceptOrRetain(
      querySchema,
      assertSortFloor(querySchema, pruneQuery(queryIntent.value)),
      queryModel
    )
  );

  // Mint the list query ONCE per scope — a `service.loadList()` inside a layer
  // factory mints a second query, with its own refs, key and effect scope. The
  // translator seeds the initial fetch from the default model (DEFAULT_SORT);
  // runtime changes reach the wire through `filterBy` / `sortBy`.
  const query = service.loadList({
    pagination: { limit: 0 },
    queryModel: queryModel.value
  });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: the
   * collection's query intent lives here, so a factory minted per call gives
   * every handle its own filter/sort state — one handle's `filterBy()` would be
   * invisible to the next. The stateless layers below stay lazy. Mirrors the
   * manager half.
   */
  const actions = createClientEmailsActions(
    actorScope,
    service,
    query,
    scopeKey,
    queryIntent,
    queryModel
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (row mutations, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + lookups). */
    useContext: () =>
      createClientEmailsContext(actorScope, service, query, queryModel),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientEmailsInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientEmailsMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own email collection.
 *
 * @example
 * ```ts
 * const emails = useClientEmails().as('self')
 * const { data, default: defaultEmail } = emails.useContext()
 * await emails.useActions().isReady()
 * await emails.useActions().setDefault(id)
 * ```
 */
export const useClientEmails = createScopedComposable<
  ReturnType<typeof createClientEmailsForScope>,
  ClientEmailsScopeMatrix
>("client-email", createClientEmailsForScope);

// Type export for consumers
export type UseClientEmails = ReturnType<typeof useClientEmails>;
