// Deep path, never the `../scope` barrel: client-company eagerly imports both
// this module and client-email, so the barrel's `export *` re-aggregation can
// still be mid-evaluation when the OTHER sibling's top-level factory call
// lands here first — the aggregator-barrel `export *` hazard
// (code-quality.companion.md). `scope.builder` alone has no such cycle.
import { createScopedComposable } from "../scope/scope.builder";
import createClientPhoneServices from "./client-phone.services";
import { createClientPhonesActions } from "./useClientPhones.actions";
import { createClientPhonesContext } from "./useClientPhones.context";
import { createClientPhonesInternals } from "./useClientPhones.internals";
import { createClientPhonesMeta } from "./useClientPhones.meta";
import type { ClientPhonesScopeMatrix } from "./client-phone.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-phone/useClientPhones
 * @description Scoped, query-backed collection of a client's own phone
 * numbers: one TanStack list query per concrete `(actor, context)` scope,
 * minted once at construction so it survives component lifecycles. Its
 * sibling is `useClientPhoneManager` — a second scoped composable in the same
 * module, registered under the SAME module name; the composable name and the
 * scope key carry the differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientPhonesForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createClientPhoneServices(actorScope, config.context);

  // Mint the list query ONCE per scope — a `service.loadList()` inside a layer
  // factory mints a second query, with its own refs, key and effect scope.
  const query = service.loadList({ pagination: { limit: 0 } });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: the
   * collection's applied `filters` live in that factory, so a factory minted
   * per call gives every handle its own filter state. Mirrors the manager
   * half.
   */
  const actions = createClientPhonesActions(
    actorScope,
    service,
    query,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (row mutations, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + lookups). */
    useContext: () => createClientPhonesContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientPhonesInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientPhonesMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own phone collection.
 *
 * @example
 * ```ts
 * const phones = useClientPhones().as('self')
 * const { data, default: defaultPhone } = phones.useContext()
 * await phones.useActions().isReady()
 * await phones.useActions().setDefault(id)
 * ```
 */
export const useClientPhones = createScopedComposable<
  ReturnType<typeof createClientPhonesForScope>,
  ClientPhonesScopeMatrix
>("client-phone", createClientPhonesForScope);

// Type export for consumers
export type UseClientPhones = ReturnType<typeof useClientPhones>;
