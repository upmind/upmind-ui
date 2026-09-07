import { ref } from "vue";
import { createScopedComposable } from "../scope";
import createInvoicesServices from "./invoices.services";
import { createInvoiceActions } from "./useInvoice.actions";
import { createInvoiceContext } from "./useInvoice.context";
import { createInvoiceInternals } from "./useInvoice.internals";
import { createInvoiceMeta } from "./useInvoice.meta";
import type { InvoiceScopeMatrix } from "./invoices.types";
import type { Currency } from "../currency/currency.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice
 * @description Scoped, query-backed read of ONE invoice: one TanStack item
 * query per concrete `(actor, id)` scope, minted once at construction. Its
 * sibling is `useInvoices`, registered under the SAME module name; the
 * composable name and the scope key carry the differentiation.
 *
 * The invoice being read is a RECORD ID (`.withId(id)`), never a scope
 * context: there is no actor-context cell to declare, so the matrix this
 * passes as its `TMatrix` refuses every actor. That is not paperwork — the
 * default `ActorContextMatrix` widens every context to `string`, so omitting
 * the type argument would leave `.for("anything", id)` type-checking
 * (`templates/SINGLE-READ.md`).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createInvoiceForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request this read issues resolves the same
   * target client.
   */
  const service = createInvoicesServices(actorScope, config.context);

  // Mint the item query ONCE per scope. `config.id` is the builder's own
  // `.withId(id)`, already folded into the scope key.
  const query = service.loadOne(config.id);

  /**
   * AC1's currency for the live unpaid-amount re-read — owned here as ONE
   * reactive ref threaded into the mint below, so a currency change re-keys
   * the SAME query rather than re-minting it.
   */
  const currencyId = ref<Currency["id"] | undefined>(undefined);
  const unpaidAmountQuery = service.loadUnpaidAmount(config.id, currencyId);

  const actions = createInvoiceActions(
    actorScope,
    service,
    query,
    unpaidAmountQuery,
    currencyId,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for single-read actions (lifecycle, AC1). */
    useActions: () => actions,

    /** Sub-composable for single-read context (the mapped invoice + unpaid amount). */
    useContext: () =>
      createInvoiceContext(actorScope, service, query, unpaidAmountQuery),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createInvoiceInternals(actorScope, query),

    /** Sub-composable for single-read meta (state flags, `paymentState`). */
    useMeta: () => createInvoiceMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for one invoice, read in full.
 *
 * @example
 * ```ts
 * const invoice = useInvoice().withId(invoiceId)
 * const { data } = invoice.useContext()
 * await invoice.useActions().isReady()
 *
 * // client x client — retarget at an entitled client's invoice
 * const subAccountInvoice = useInvoice().as('client').for('client', clientId).withId(invoiceId)
 * ```
 */
export const useInvoice = createScopedComposable<
  ReturnType<typeof createInvoiceForScope>,
  InvoiceScopeMatrix
>("invoices", createInvoiceForScope);

// Type export for consumers
export type UseInvoice = ReturnType<typeof useInvoice>;
