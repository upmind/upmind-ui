import { createScopedComposable } from "../scope";
import createClientEmailServices from "./client-email.services";
import { createClientEmailsActions } from "./useClientEmails.actions";
import { createClientEmailsContext } from "./useClientEmails.context";
import { createClientEmailsInternals } from "./useClientEmails.internals";
import { createClientEmailsMeta } from "./useClientEmails.meta";
import type { ClientEmailsScopeMatrix } from "./client-email.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
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

  // Mint the list query ONCE per scope — a `service.loadList()` inside a layer
  // factory mints a second query, with its own refs, key and effect scope.
  const query = service.loadList({ pagination: { limit: 0 } });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: the
   * collection's applied `filters` live in that factory, so a factory minted
   * per call gives every handle its own filter state — one handle's
   * `filters.query()` would be invisible to the next, and a second handle's
   * first filter would silently drop the first handle's. The stateless layers
   * below stay lazy. Mirrors the manager half.
   */
  const actions = createClientEmailsActions(
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
    useContext: () => createClientEmailsContext(actorScope, service, query),

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
