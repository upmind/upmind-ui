// `../scope`'s own graph reaches this module before its barrel finishes
// (scope.utils → session-store → … → client-company.services → client-email),
// so a value read off that barrel at module scope is `undefined` here. The
// declaring file is safe: `createScopedComposable` is a hoisted declaration.
import { createScopedComposable } from "../scope/scope.builder";
import createClientEmailServices from "./client-email.services";
import { CLIENT_EMAILS_SCOPE_MATRIX } from "./client-email.types";
import { createClientEmailsActions } from "./useClientEmails.actions";
import { createClientEmailsContext } from "./useClientEmails.context";
import { createClientEmailsInternals } from "./useClientEmails.internals";
import { createClientEmailsMeta } from "./useClientEmails.meta";
import type { ClientEmailsScopeMatrix } from "./client-email.types";
import type { ScopeActorTypes, ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails
 * @description Scoped, query-backed collection of a client's email addresses:
 * one TanStack list query per concrete `(actor, context)` scope, minted once at
 * construction so it survives component lifecycles. Its sibling is
 * `useClientEmailManager` — a second scoped composable in the same module,
 * registered under the SAME module name; the composable name and the scope key
 * carry the differentiation.
 */
function createClientEmailsForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createClientEmailServices(actorScope, config.context);

  // Minted ONCE per scope — a `service.loadList()` inside a layer factory
  // mints a second query, with its own refs, key and effect scope.
  const query = service.loadList();

  /** ONE actions instance per scope; the layers below stay lazy. */
  const actions = createClientEmailsActions(
    actorScope,
    service,
    query,
    scopeKey
  );

  return {
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
>("client-email", createClientEmailsForScope, CLIENT_EMAILS_SCOPE_MATRIX);

export type UseClientEmails = ReturnType<typeof useClientEmails>;
