import { computed, getCurrentScope, ref, shallowRef, watch } from "vue";
import { interpret } from "xstate";
import { usePaymentDetail, usePaymentGateway } from "../payment-details";
import { useQueryParams } from "../routing/useQueryParams";
import { createScopedComposable } from "../scope";
import { useSystem } from "../system";
import { useI18n } from "../system-localisation";
import invoiceMachine from "./invoice.machine";
import { loadItemImages } from "./invoice.services";
import { snapshotProductIds } from "./invoice.utils";
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
import { isEmpty, noop } from "lodash-es";
import type { PaymentDetail } from "../payment-details";
import type {
  InvoiceItemImagesQuery,
  InvoicePayContext,
  InvoicePaymentDetailsModel,
  InvoiceScopeMatrix
} from "./invoices.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ScopeConfig, ScopeKey } from "../scope/scope.types";
import type { IBillingCycle, IInvoice } from "@upmind-automation/types";
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
  const { t } = useI18n();
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
      t("error.invoice_not_available"),
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

  // The payment-method model staged by `useActions().input()` and saved by
  // `updatePaymentDetails()`; owned here so it survives across `useActions()`
  // calls. `null` clears the assignment.
  const paymentDetailsModel = ref<InvoicePaymentDetailsModel>({
    payment_details_id: null
  });

  // The client's stored cards the payment-method form picks from, read by
  // `useActions().openPaymentMethod()` and held until the scope is destroyed.
  const storedPaymentMethods = ref<PaymentDetail[]>();

  const errors = useContext<ResponseError | undefined>(actor.state, "error");
  const rawInvoice = useContext<IInvoice | undefined>(
    actor.state,
    "rawInvoice"
  );

  // The item term names. Not awaited: `isReady()` never waits on a label, and a
  // failed read leaves each item's `billingCycle` undefined.
  const billingCycles = ref<IBillingCycle[]>([]);
  useSystem()
    .ensureBillingCycles()
    .then(cycles => {
      billingCycles.value = cycles;
    })
    .catch(noop);

  // A `query()` url is fixed at build, so the image read is minted ONCE, with
  // the snapshot ids of the first loaded record, inside this scope.
  const scope = getCurrentScope();
  const itemImagesQuery = shallowRef<InvoiceItemImagesQuery>();
  const stopItemImages = watch(rawInvoice, raw => {
    if (!raw?.id || itemImagesQuery.value) return;
    itemImagesQuery.value = scope?.run(() =>
      loadItemImages(invoiceId, snapshotProductIds(raw))
    );
    stopItemImages();
  });
  const itemImages = computed<Record<string, string>>(
    () => itemImagesQuery.value?.data.value ?? {}
  );

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
        storedPaymentMethods
      ),

    /** Sub-composable for single-invoice context (mapped invoice, error). */
    useContext: () =>
      createInvoiceContext(
        actorScope,
        actor,
        paymentDetailsModel,
        storedPaymentMethods,
        billingCycles,
        itemImages
      ),

    /** Sub-composable for advanced debugging and the delegated payment composables. */
    useInternals: () =>
      createInvoiceInternals(actorScope, actor, paymentDetail, gateway),

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
 * const { model } = invoice.useContext()
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
