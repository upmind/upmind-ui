import { useContext } from "../../utils";
import type { Invoice } from "./invoices.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice.context
 * @description Single-invoice context — the mapped invoice record (published as
 * `model`, the runtime's render key, never a `data` node) and its captured
 * error. The pay currency and its unpaid amount ride on `model`
 * (`currencyPayment`, `summary`).
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 */
export function createInvoiceContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  return {
    /** The scope's captured error — read, never raised. */
    error: useContext<ResponseError | undefined>(state, "error"),

    /** The mapped invoice record this scope resolved. */
    model: useContext<Invoice | undefined>(state, "invoice")
  };
}

// Type export for consumers
export type UseInvoiceContext = ReturnType<typeof createInvoiceContext>;
