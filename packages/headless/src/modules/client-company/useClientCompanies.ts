import { createScopedComposable } from "../scope/scope.builder";
import createClientCompanyServices from "./client-company.services";
import { createClientCompaniesActions } from "./useClientCompanies.actions";
import { createClientCompaniesContext } from "./useClientCompanies.context";
import { createClientCompaniesInternals } from "./useClientCompanies.internals";
import { createClientCompaniesMeta } from "./useClientCompanies.meta";
import type { ClientCompaniesScopeMatrix } from "./client-company.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-company/useClientCompanies
 * @description Scoped, query-backed collection of a client's own companies:
 * one TanStack list query per concrete `(actor, context)` scope, minted once
 * at construction so it survives component lifecycles. Its sibling is
 * `useClientCompanyManager` — a second scoped composable in the same module,
 * registered under the SAME module name; the composable name and the scope
 * key carry the differentiation (`design.md` D1).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientCompaniesForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createClientCompanyServices(actorScope, config.context);

  // Mint the list query ONCE per scope — a `service.loadList()` inside a layer
  // factory mints a second query, with its own refs, key and effect scope.
  const query = service.loadList();

  /**
   * ONE actions instance per scope, not one per `useActions()` call: the
   * collection's applied `filters` live in that factory, so a factory minted
   * per call gives every handle its own filter state. Mirrors the manager
   * half.
   */
  const actions = createClientCompaniesActions(
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
    useContext: () => createClientCompaniesContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientCompaniesInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientCompaniesMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own company collection.
 *
 * @example
 * ```ts
 * const companies = useClientCompanies().as('client')
 * const { data, default: defaultCompanyId } = companies.useContext()
 * await companies.useActions().isReady()
 * await companies.useActions().setDefault(id)
 * ```
 */
export const useClientCompanies = createScopedComposable<
  ReturnType<typeof createClientCompaniesForScope>,
  ClientCompaniesScopeMatrix
>("client-company", createClientCompaniesForScope);

// Type export for consumers
export type UseClientCompanies = ReturnType<typeof useClientCompanies>;
