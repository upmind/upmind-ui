import { computed } from "vue";
import { useBrand } from "../brand";
import { mapInvoiceItems } from "./invoices.mappers";
import {
  useInvoiceCurrencySchema,
  useInvoiceCurrencyUischema,
  useInvoicePaymentMethodSchema,
  useInvoicePaymentMethodUischema
} from "./invoices.schemas";
import { useContext } from "../../utils";
import type { PaymentDetail } from "../payment-details";
import type {
  Invoice,
  InvoiceForm,
  InvoiceItem,
  InvoicePaymentDetailsModel
} from "./invoices.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { IBillingCycle, IInvoice } from "@upmind-automation/types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice.context
 * @description Single-invoice context — the mapped invoice record (published as
 * `model`, the runtime's render key, never a `data` node), its order items,
 * its captured error,
 * and the `{ schema, uischema, model }` slots of its two write forms. The pay
 * currency and its unpaid amount ride on `model` (`currencyPayment`, `summary`).
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 */
export function createInvoiceContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  paymentDetailsModel: Ref<InvoicePaymentDetailsModel>,
  storedPaymentMethods: Ref<PaymentDetail[] | undefined>,
  billingCycles: Ref<IBillingCycle[]>,
  itemImages: Ref<Record<string, string>>
) {
  const { state } = actor;
  const { currencies } = useBrand();
  const invoice = useContext<Invoice | undefined>(state, "invoice");
  const rawInvoice = useContext<IInvoice | undefined>(state, "rawInvoice");

  return {
    /**
     * The pay-currency form `useActions().setCurrency()` takes its `code`
     * from — the brand's currencies, the invoice's pay currency preselected.
     * It holds no model: the caller holds the pick.
     */
    currency: computed<InvoiceForm>(() => ({
      schema: useInvoiceCurrencySchema(
        currencies.value,
        invoice.value?.currencyPayment?.code
      ),
      uischema: useInvoiceCurrencyUischema()
    })),

    /** The scope's captured error — read, never raised. */
    error: useContext<ResponseError | undefined>(state, "error"),

    /**
     * The order's items — the snapshot first, the live products second — with
     * each item's billing cycle and catalogue image once those resolve.
     */
    items: computed<InvoiceItem[]>(() =>
      mapInvoiceItems(rawInvoice.value, {
        billingCycles: billingCycles.value,
        imageMap: itemImages.value
      })
    ),

    /** The mapped invoice record this scope resolved. */
    model: invoice,

    /**
     * The payment-method form — the stored cards `openPaymentMethod()` read
     * (no schema until it has), over the model `input()` stages and
     * `updatePaymentDetails()` saves.
     */
    paymentMethod: computed<InvoiceForm>(() => ({
      schema: storedPaymentMethods.value
        ? useInvoicePaymentMethodSchema(
            storedPaymentMethods.value,
            invoice.value?.paymentMethod.id ?? null
          )
        : undefined,
      uischema: useInvoicePaymentMethodUischema(),
      model: paymentDetailsModel.value
    }))
  };
}

// Type export for consumers
export type UseInvoiceContext = ReturnType<typeof createInvoiceContext>;
