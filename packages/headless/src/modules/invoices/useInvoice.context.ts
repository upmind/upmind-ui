import { useContext } from "../../utils";
import type { Invoice, InvoiceUnpaidAmount } from "./invoices.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice.context
 * @description Single-invoice context — the mapped invoice record (published as
 * `model`, the runtime's render key, never a `data` node), its captured error,
 * and the live unpaid amount converted to the selected currency (AC1).
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 */
export function createInvoiceContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  unpaidAmount: Ref<InvoiceUnpaidAmount | undefined>
) {
  const { state } = actor;

  return {
    /** The scope's captured error — read, never raised. */
    error: useContext<ResponseError | undefined>(state, "error"),

    /** The mapped invoice record this scope resolved. */
    model: useContext<Invoice | undefined>(state, "invoice"),

    /** AC1 — the live unpaid amount, converted to the selected currency. */
    unpaidAmount
  };
}

// Type export for consumers
export type UseInvoiceContext = ReturnType<typeof createInvoiceContext>;
