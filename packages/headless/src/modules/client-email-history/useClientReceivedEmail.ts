import { createScopedComposable } from "../scope";
import createClientEmailHistoryServices from "./client-email-history.services";
import { ReceivedEmailContextTypes } from "./client-email-history.types";
import { createClientReceivedEmailActions } from "./useClientReceivedEmail.actions";
import { createClientReceivedEmailContext } from "./useClientReceivedEmail.context";
import { createClientReceivedEmailInternals } from "./useClientReceivedEmail.internals";
import { createClientReceivedEmailMeta } from "./useClientReceivedEmail.meta";
import type { ReceivedEmailScopeMatrix } from "./client-email-history.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/useClientReceivedEmail
 * @description Scoped, query-backed read of ONE of a client's own received
 * emails: one TanStack item query per concrete `(actor, context)` scope,
 * minted once at construction. A separately exported, separately consumed
 * capability with its own route (`Email.vue` → `EmailOverview.vue`) — its
 * sibling is `useClientReceivedEmails`, registered under the SAME module
 * name; the composable name and the scope key carry the differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientReceivedEmailForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request this read issues resolves the same target
   * client.
   */
  const service = createClientEmailHistoryServices(actorScope, config.context);

  // The scope context names the EMAIL; the id comes from it, never from a
  // construction argument — that is what makes the instance keyed per email.
  const emailId =
    config.context?.type === ReceivedEmailContextTypes.EMAIL
      ? config.context.id
      : undefined;

  // Mint the item query ONCE per scope.
  const query = service.loadOne(emailId);

  const actions = createClientReceivedEmailActions(
    actorScope,
    service,
    query,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for single-read actions (lifecycle). */
    useActions: () => actions,

    /** Sub-composable for single-read context (the mapped email + error). */
    useContext: () =>
      createClientReceivedEmailContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientReceivedEmailInternals(actorScope, query),

    /** Sub-composable for single-read meta (state flags). */
    useMeta: () => createClientReceivedEmailMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for one of a client's own received emails, read in full.
 *
 * @example
 * ```ts
 * const email = useClientReceivedEmail().as('client').for('email', emailId)
 * const { data } = email.useContext()
 * await email.useActions().isReady()
 * ```
 */
export const useClientReceivedEmail = createScopedComposable<
  ReturnType<typeof createClientReceivedEmailForScope>,
  ReceivedEmailScopeMatrix
>("client-email-history", createClientReceivedEmailForScope);

// Type export for consumers
export type UseClientReceivedEmail = ReturnType<typeof useClientReceivedEmail>;
