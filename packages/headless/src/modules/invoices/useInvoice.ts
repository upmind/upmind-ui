import { ref, watch } from "vue";
import { interpret } from "xstate";
import { useBasketCurrency } from "../basket";
import { usePaymentDetail, usePaymentGateway } from "../payment-details";
import { useQueryParams } from "../routing/useQueryParams";
import { createScopedComposable } from "../scope";
import invoiceMachine from "./invoice.machine";
import { loadUnpaidAmount } from "./invoice.services";
import { INVOICE_SCOPE_MATRIX } from "./invoices.types";
import { createInvoiceActions } from "./useInvoice.actions";
import { createInvoiceContext } from "./useInvoice.context";
import { createInvoiceInternals } from "./useInvoice.internals";
import { createInvoiceMeta } from "./useInvoice.meta";
import {
  createActor,
  stateMatches,
  useContext,
  useContextActor,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import { isEmpty } from "lodash-es";
import type {
  InvoicePayContext,
  InvoicePaymentDetailsModel,
  InvoiceScopeMatrix
} from "./invoices.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ScopeConfig, ScopeKey } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice
 * @description Scoped single-invoice composable — reads ONE invoice and
 * orchestrates its payment via the invoice machine (spawns paymentDetail,
 * invokes payment, supports retry/partial loops), and owns the PDF download,
 * payment-method assignment and pay-currency switch. Client and guest only.
 * Reference implementation: `modules/auth/`.
 */
// -----------------------------------------------------------------------------
/**
 * Builds the single-invoice composable for one resolved scope. The actor is
 * already resolved by the scope builder (SELF → concrete actor); the invoice is
 * the `.withId(id)` record on `config.id`.
 * @private
 */
function createInvoiceForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;
  const invoiceId = config.id as string;
  const { getParam, setParam } = useQueryParams();

  // Seeded from an offsite gateway return (`?payment_success=false`); mirrored
  // back on outcome. `useQueryParams` no-ops without a router, so a headless
  // caller reads `undefined` here and writes nothing.
  const paymentFailed = ref(getParam("payment_success") === false);

  const service = interpret(
    invoiceMachine.withContext({ invoiceId } as InvoicePayContext),
    { devTools: true }
  );
  service.start();

  const actor = createActor(service);
  if (!actor) {
    throw new DetailedError(
      "Invoice unavailable",
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  // The spawned paymentDetail child drives gateway selection and payment; the
  // machine re-spawns it on each `collecting` entry, so it is read reactively.
  const paymentDetailActor = useContextActor(actor.state, "paymentDetailActor");
  const paymentDetail = usePaymentDetail(paymentDetailActor);
  const gateway = usePaymentGateway(paymentDetail.gateway);
  const basketCurrency = useBasketCurrency();

  // The payment-method model staged by `useActions().input()` and saved by
  // `updatePaymentDetails()`; owned here so it survives across `useActions()`
  // calls. `null` clears the assignment.
  const paymentDetailsModel = ref<InvoicePaymentDetailsModel>({
    payment_details_id: null
  });

  // The live unpaid amount, converted to the client's selected currency; it
  // re-reads through the query layer's `withCurrency` when `setCurrency` moves
  // the basket currency (AC1 — the legacy pay modal's convert-on-switch).
  const unpaidAmountQuery = loadUnpaidAmount(invoiceId);

  const errors = useContext<ResponseError | undefined>(actor.state, "error");

  // Mirror the pay outcome onto the `?payment_success` param, so an offsite
  // return lands back on the right state.
  watch(
    () => stateMatches(actor.state, ["available.refreshing", "complete"]),
    success => {
      if (success) {
        paymentFailed.value = false;
        setParam("payment_success", "true", true);
      }
    }
  );

  watch(
    () =>
      stateMatches(actor.state, ["available.collecting"]) &&
      !isEmpty(errors.value),
    failed => {
      if (failed) {
        paymentFailed.value = true;
        setParam("payment_success", "false", true);
      }
    }
  );

  return {
    // --- Sub-composables (no direct props)
    /** Sub-composable for single-invoice actions (pay, lifecycle, writes). */
    useActions: () =>
      createInvoiceActions(
        actorScope,
        actor,
        scopeKey,
        invoiceId,
        paymentFailed,
        paymentDetailsModel,
        basketCurrency
      ),

    /** Sub-composable for single-invoice context (mapped invoice, unpaid amount). */
    useContext: () =>
      createInvoiceContext(actorScope, actor, unpaidAmountQuery.data),

    /** Sub-composable for advanced debugging and the delegated payment composables. */
    useInternals: () =>
      createInvoiceInternals(
        actorScope,
        actor,
        paymentDetail,
        gateway,
        basketCurrency
      ),

    /** Sub-composable for single-invoice meta (state flags). */
    useMeta: () => createInvoiceMeta(actorScope, actor, paymentFailed)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for one invoice, read and paid.
 *
 * @example
 * ```ts
 * const invoice = useInvoice().withId(invoiceId)          // as self
 * const guestInvoice = useInvoice().as('guest').withId(invoiceId)
 * const { invoice: data, unpaidAmount } = invoice.useContext()
 * await invoice.useActions().isReady()
 * invoice.useActions().pay()
 * ```
 */
export const useInvoice = createScopedComposable<
  ReturnType<typeof createInvoiceForScope>,
  InvoiceScopeMatrix
>("invoices", createInvoiceForScope, INVOICE_SCOPE_MATRIX);

// Type export for consumers
export type UseInvoice = ReturnType<typeof useInvoice>;
