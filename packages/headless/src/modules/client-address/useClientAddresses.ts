import { createScopedComposable } from "../scope/scope.builder";
import createClientAddressServices from "./client-address.services";
import { createClientAddressesActions } from "./useClientAddresses.actions";
import { createClientAddressesContext } from "./useClientAddresses.context";
import { createClientAddressesInternals } from "./useClientAddresses.internals";
import { createClientAddressesMeta } from "./useClientAddresses.meta";
import type { ClientAddressesScopeMatrix } from "./client-address.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-address/useClientAddresses
 * @description Scoped, query-backed collection of a client's own postal
 * addresses: one TanStack list query per concrete `(actor, context)` scope,
 * minted once at construction so it survives component lifecycles. Its sibling
 * is `useClientAddressManager` — a second scoped composable in the same module,
 * registered under the SAME module name; the composable name and the scope key
 * carry the differentiation (`design.md` §0).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientAddressesForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createClientAddressServices(actorScope, config.context);

  // Mint the list query ONCE per scope — a `service.loadList()` inside a layer
  // factory mints a second query, with its own refs, key and effect scope.
  const query = service.loadList({ pagination: { limit: 0 } });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: the
   * collection's applied `filters` live in that factory, so a factory minted
   * per call gives every handle its own filter state.
   */
  const actions = createClientAddressesActions(
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
    useContext: () => createClientAddressesContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientAddressesInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientAddressesMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own address collection.
 *
 * @example
 * ```ts
 * const addresses = useClientAddresses().as('client')
 * const { data, default: defaultAddressId, getOne } = addresses.useContext()
 * await addresses.useActions().isReady()
 * await addresses.useActions().setDefault(id)
 * ```
 */
export const useClientAddresses = createScopedComposable<
  ReturnType<typeof createClientAddressesForScope>,
  ClientAddressesScopeMatrix
>("client-address", createClientAddressesForScope);

// Type export for consumers
export type UseClientAddresses = ReturnType<typeof useClientAddresses>;
