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

  // Mint the list query ONCE per scope. `loadList()` takes nothing — the
  // request state is the declared query schema, and the schema's own
  // `pagination.limit` default governs the boot window.
  const query = service.loadList();

  /** ONE actions instance per scope; the layers below stay lazy. */
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
 * @decision
 * what:     The COLLECTION keeps `RECEIVED_EMAILS_SCOPE_MATRIX` — its
 *           `client -> ReceivedEmailsContextTypes.CLIENT` cell, and the
 *           `null as never` cells for `staff` / `guest` / `self`. FE-3095
 *           deleted the single read's CONTEXT ENUM, not its matrix: that
 *           matrix was rebuilt all-`never` and kept, because dropping it
 *           entirely restores the wide default and re-opens `.for()`.
 *
 * why:      (1) The two composables scope on DIFFERENT things, which is why
 *               only one of them was wrong. The single read's `email` cell
 *               named a LEAF RECORD — never an ADR-001 context type — and a
 *               record id belongs on `.withId(id)`. The collection's `client`
 *               cell names a genuine ADR-001 context: whose history is read.
 *           (2) The matrix's load-bearing content here is the REFUSAL, not
 *               the cell. A `null as never` cell governs `.for()` and nothing
 *               else: it removes `.for()` for that actor, so `staff` cannot
 *               RETARGET this read at another client. (It does NOT refuse
 *               `.as('staff')` — `as<TActor extends ScopeActorTypes>` carries
 *               no matrix constraint, verified by tsc probe. Any doc claiming
 *               otherwise is wrong.) `.for('client', id)` for staff is exactly
 *               the capability the oracle has and this code does not, so the
 *               refusal is what keeps it unspellable instead of compiling and
 *               silently changing nothing — the FE-2824 shape this story is
 *               closing, inverted.
 *
 *               THE ORACLE. Legacy DOES support a staff read of a client's
 *               email history: `list_client_email_history` over
 *               `GET api/admin/clients/{id}/email_history`
 *               (`vue-app/docs/feature-analysis/features/email-history.md`,
 *               Actor × Context matrix + API-endpoints table;
 *               `vue-app/src/components/app/global/emailHistory/emailsHistoryProvider.vue:71`).
 *               This module does not implement it — the services layer wires
 *               one self-shaped endpoint and branches on no actor — and
 *               FE-3095 deliberately does not add it (operator ruling,
 *               2026-08-20). Never record this as an oracle gap: it is a
 *               shipped-surface gap.
 *
 *               PARITY DISPOSITION (`verify-parity-oracle.companion.md`):
 *               `Staff × CLIENT — list` is `Dropped-with-Linear-issue` — a
 *               DELIBERATE, operator-ruled drop, not an oversight and not an
 *               absent endpoint. Linear issue: `TODO-OPERATOR` (file the
 *               staff-read follow-up; replace this token with its reference).
 *
 * rejected: Tighten the CLIENT cell to `null as never` too, on the grounds
 *           that `self/email_history` takes no client id, so a
 *           `.for('client', id)` retargets the cache key and the addressability
 *           predicate but NOT the request url (design D1's documented
 *           divergence). This is a real, separate mismatch — an offered
 *           `.for()` the url does not honour — but resolving it is a call about
 *           the COLLECTION's endpoint shape, not about the leaf-record-as-context
 *           defect FE-3095 fixes. Changing it here would withdraw
 *           `.for('client', id)` from every current consumer inside a story
 *           that never analysed the collection's wire. Left for the repo-wide
 *           audit FE-3095 deferred.
 *
 *           Also rejected: fold both composables onto ONE matrix. They scope on
 *           different things, so one matrix could only serve both by widening to
 *           whatever satisfies neither.
 */
/**
 * Scoped composable for a client's own received email history.
 *
 * @example
 * ```ts
 * const history = useClientReceivedEmails().as('client')
 * const { data, schemas } = history.useContext()
 * await history.useActions().isReady()
 * history.useActions().setCriteria({ filters: { bounced: { eq: true } } })
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
