import { PAGINATION } from "../query";
import { createScopedComposable } from "../scope";
import createClientEmailHistoryServices from "./client-email-history.services";
import { createClientReceivedEmailsActions } from "./useClientReceivedEmails.actions";
import { createClientReceivedEmailsContext } from "./useClientReceivedEmails.context";
import { createClientReceivedEmailsInternals } from "./useClientReceivedEmails.internals";
import { createClientReceivedEmailsMeta } from "./useClientReceivedEmails.meta";
import type { ReceivedEmailsScopeMatrix } from "./client-email-history.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/useClientReceivedEmails
 * @description Scoped, query-backed collection of a client's own received
 * email history: one TanStack list query per concrete `(actor, context)`
 * scope, minted once at construction so it survives component lifecycles. Its
 * sibling is `useClientReceivedEmail` — a second scoped composable in the same
 * module, registered under the SAME module name; the composable name and the
 * scope key carry the differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientReceivedEmailsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createClientEmailHistoryServices(actorScope, config.context);

  // Mint the list query ONCE per scope. `limit` comes from the platform
  // constant, not an invented number: PAGINATION.limit IS the 10 the legacy
  // consumer passed at construction.
  const query = service.loadList({ pagination: { limit: PAGINATION.limit } });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: the
   * applied `filters` ref lives in that factory, so a factory minted per call
   * would give every handle its own filter state.
   */
  const actions = createClientReceivedEmailsActions(
    actorScope,
    service,
    query,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (list controls, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + lookups). */
    useContext: () =>
      createClientReceivedEmailsContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientReceivedEmailsInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientReceivedEmailsMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own received email history.
 *
 * @example
 * ```ts
 * const history = useClientReceivedEmails().as('client')
 * const { data } = history.useContext()
 * await history.useActions().isReady()
 * history.useActions().filters.status(SentEmailStatus.BOUNCED)
 * ```
 */
export const useClientReceivedEmails = createScopedComposable<
  ReturnType<typeof createClientReceivedEmailsForScope>,
  ReceivedEmailsScopeMatrix
>("client-email-history", createClientReceivedEmailsForScope);

// Type export for consumers
export type UseClientReceivedEmails = ReturnType<
  typeof useClientReceivedEmails
>;
