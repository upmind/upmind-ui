import { createScopedComposable } from "../scope";
import createClientEmailHistoryServices from "./client-email-history.services";
import { createClientReceivedEmailActions } from "./useClientReceivedEmail.actions";
import { createClientReceivedEmailContext } from "./useClientReceivedEmail.context";
import { createClientReceivedEmailInternals } from "./useClientReceivedEmail.internals";
import { createClientReceivedEmailMeta } from "./useClientReceivedEmail.meta";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/useClientReceivedEmail
 * @description Scoped, query-backed read of ONE of a client's own received
 * emails: one TanStack item query per concrete `(actor, id)` scope, minted once
 * at construction. A separately exported, separately consumed capability with
 * its own route (`Email.vue` → `EmailOverview.vue`) — its sibling is
 * `useClientReceivedEmails`, registered under the SAME module name; the
 * composable name and the scope key carry the differentiation.
 *
 * The email being read is a RECORD ID (`.withId(id)`), never a scope context:
 * the composable declares no matrix, because there is no actor-context cell to
 * declare (FE-3095).
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

  // Mint the item query ONCE per scope. `config.id` is the builder's own
  // `.withId(id)`, already folded into the scope key, which is what makes the
  // instance keyed per email rather than shared across every row opened.
  const query = service.loadOne(config.id);

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
 * The actor defaults to SELF, so `.as()` is optional; naming one explicitly is
 * how a future staff arm would be reached.
 *
 * @example
 * ```ts
 * const email = useClientReceivedEmail().withId(emailId)
 * const { data } = email.useContext()
 * await email.useActions().isReady()
 * ```
 */
export const useClientReceivedEmail = createScopedComposable<
  ReturnType<typeof createClientReceivedEmailForScope>
>("client-email-history", createClientReceivedEmailForScope);

// Type export for consumers
export type UseClientReceivedEmail = ReturnType<typeof useClientReceivedEmail>;
