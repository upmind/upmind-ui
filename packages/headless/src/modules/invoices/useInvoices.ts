import { createScopedComposable } from "../scope";
import createInvoicesServices from "./invoices.services";
import { INVOICES_SCOPE_MATRIX } from "./invoices.types";
import { createInvoicesActions } from "./useInvoices.actions";
import { createInvoicesContext } from "./useInvoices.context";
import { createInvoicesInternals } from "./useInvoices.internals";
import { createInvoicesMeta } from "./useInvoices.meta";
import type { InvoicesScopeMatrix } from "./invoices.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoices
 * @description Scoped, query-backed collection of a client's invoices: one
 * TanStack list query per concrete `(actor, context)` scope, minted once at
 * construction so it survives component lifecycles. Its sibling is
 * `useInvoice` — a second scoped composable registered under the SAME
 * module name. `generateScopeKey` builds `[name, actor, context?, id?]`
 * (`scope/scope.utils.ts:29-58`) — the composable's own name plays NO part
 * in the key (W3); the two stay apart in the registry only because
 * `useInvoice` always adds a `.withId(id)` segment a collection scope never
 * does — pre-existing platform behaviour (`client-email-history`,
 * `client-phone` share it too), not fixed here.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createInvoicesForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createInvoicesServices(actorScope, config.context);

  // Mint the list query ONCE per scope. `loadList()` takes nothing — the
  // request state is the declared query schema, and the schema's own
  // `pagination.limit` default governs the boot window.
  const query = service.loadList();

  /**
   * AC10's unpaid-existence count — a separate, lightweight (count-only)
   * query, minted ONCE alongside the list query so `meta.hasUnpaid` never
   * re-mints it on repeated `useMeta()` calls.
   */
  const unpaidExistenceQuery = service.loadUnpaidExistence();

  /**
   * AC2's consolidatable-count — a separate, lightweight (count-only) query,
   * minted ONCE alongside the list query, over its OWN criteria, so
   * `meta.consolidatableCount` never re-mints it and never shares the list
   * query's criteria object.
   */
  const consolidatableCountQuery = service.loadConsolidatableCount();

  /** ONE actions instance per scope; the layers below stay lazy. */
  const actions = createInvoicesActions(actorScope, service, query, scopeKey);

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (list controls, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + criteria/schemas). */
    useContext: () => createInvoicesContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createInvoicesInternals(actorScope, query, service),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () =>
      createInvoicesMeta(
        actorScope,
        service,
        query,
        unpaidExistenceQuery,
        consolidatableCountQuery
      )
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's invoices.
 *
 * @example
 * ```ts
 * const invoices = useInvoices().as('self')
 * const { data, schemas } = invoices.useContext()
 * await invoices.useActions().isReady()
 * invoices.useActions().setCriteria({ filters: { "status.code": { in: ["invoice_unpaid"] } } })
 *
 * // client x client — retarget at an entitled client
 * const subAccount = useInvoices().as('client').for('client', clientId)
 *
 * // relationship scope — one entity per read (FE-3031 F3, OR-1)
 * const byContract = useInvoices().for('contract', contractId)
 * const byProduct = useInvoices().for('contracts_product', contractProductId)
 * const creditNotes = useInvoices().for('invoice', parentInvoiceId)
 * ```
 */
export const useInvoices = createScopedComposable<
  ReturnType<typeof createInvoicesForScope>,
  InvoicesScopeMatrix
>("invoices", createInvoicesForScope, INVOICES_SCOPE_MATRIX);

// Type export for consumers
export type UseInvoices = ReturnType<typeof useInvoices>;
