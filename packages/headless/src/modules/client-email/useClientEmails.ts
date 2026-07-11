import { createScopedComposable } from "../scope";
import service from "./client-email.services";
import { createClientEmailsActions } from "./useClientEmails.actions";
import { createClientEmailsContext } from "./useClientEmails.context";
import { createClientEmailsInternals } from "./useClientEmails.internals";
import { createClientEmailsMeta } from "./useClientEmails.meta";
import type { ClientEmailsScopeMatrix } from "./client-email.types";
import type { ScopeActorTypes } from "../scope";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails
 * @description Scoped client-emails collection composable. Query-backed (no
 * machine): one TanStack list query per concrete `(actor, context)` scope,
 * minted once at construction inside the scope registry's detached effect scope
 * so the query survives component lifecycles. Returns ONLY the four
 * sub-composable factories — no direct props (ADR 001 four-layer return).
 */
// -----------------------------------------------------------------------------
/**
 * Creates the client-emails collection for a specific scope. Actor is already
 * resolved by the scope builder (SELF → concrete actor); the list is addressed
 * to the active session's client by the underlying service.
 * @private
 */
function createClientEmailsForScope(
  config: ScopeConfig,
  _session: IToken | undefined,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  // Mint the list query once per scope (persists via the registry effect scope).
  const query = service.loadList({ pagination: { limit: 0 } });

  return {
    // --- Sub-composables (no direct props)
    /** Sub-composable for collection actions (mutations, pagination, filters). */
    useActions: () => createClientEmailsActions(query, scopeKey),

    /** Sub-composable for collection context (reactive list + lookups). */
    useContext: () => createClientEmailsContext(query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientEmailsInternals(query, actorScope),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientEmailsMeta(query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's email collection.
 *
 * @example
 * ```ts
 * // Active session's emails (resolves SELF → active actor)
 * const emails = useClientEmails().as('self')
 * const { data, default: getDefault } = emails.useContext()
 * await emails.useActions().isReady()
 *
 * // Staff viewing a specific client's emails
 * const clientEmails = useClientEmails().as('staff').for('client', clientId)
 * ```
 */
export const useClientEmails = createScopedComposable<
  ReturnType<typeof createClientEmailsForScope>,
  ClientEmailsScopeMatrix
>("client-emails", createClientEmailsForScope);

// Type export for consumers
export type UseClientEmails = ReturnType<typeof useClientEmails>;
