/** @internal */
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { invalidateQueryByKey, useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  responseCodes
} from "../../utils";
import { find } from "lodash-es";
import type {
  Invoice,
  InvoiceCurrencyConversion,
  InvoiceLookups,
  InvoicePayContext,
  InvoicePaymentDetailsModel
} from "./invoices.types";
import type { IInvoice } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
/**
 * @module invoices/invoice.services
 * @description Services for the single-invoice pay orchestrator machine, plus
 * the reads and writes the single invoice owns: the pay-currency conversion
 * (`GET invoices/unpaid_amount/{id}`), the payment-method assignment
 * (`PATCH invoices/{id}/payment_details`) and the PDF download
 * (`GET invoices/{id}/download`). Self only — client and guest read their own
 * invoice through the session.
 */

async function loadLookups(
  { invoiceId }: InvoicePayContext,
  _event: AnyEventObject
): Promise<InvoiceLookups> {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser } = useActiveSession().useContext();
  const { get, useUrl } = useQuery();

  if (!isAuthenticated.value || !activeUser.value?.id) {
    throw new NotAuthenticatedError();
  }

  const config = await useBrand().ensureConfig([
    BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED
  ]);

  const invoice = await get<IInvoice>({
    url: useUrl(`/invoices/${invoiceId}`, {
      with: [
        "brand",
        "taxes",
        "client",
        "status",
        "contract",
        "address",
        "address.country",
        "payments",
        "payments.payment_details",
        "products",
        "promotions",
        "client.tags",
        "products.tags",
        "taxes.tax_tag_data",
        "custom_fields.field",
        "affiliate_commissions",
        "products.product.image",
        "account.affiliate_referral.affiliate_account.account.client"
      ].join(",")
    }),
    queryKey: ["order", invoiceId],
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0
  });

  return { ...invoice, config };
}

/**
 * Converts the invoice's unpaid amount to the pay currency `event.data.code`
 * (`GET invoices/unpaid_amount/{id}?currency_code=`). Legacy oracle:
 * `invoicePaymentModal.vue:500-511`.
 * @throws {DetailedError} when the code is not a brand currency.
 * @throws {NotAuthenticatedError} when the session cannot address a client.
 */
async function convertCurrency(
  { invoiceId }: InvoicePayContext,
  { data }: AnyEventObject
): Promise<InvoiceCurrencyConversion> {
  const { t } = useI18n();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser } = useActiveSession().useContext();
  const { get, useUrl } = useQuery();

  if (!isAuthenticated.value || !activeUser.value?.id) {
    throw new NotAuthenticatedError();
  }

  const currency = find(useBrand().currencies.value, ["code", data?.code]);
  if (!currency) {
    throw new DetailedError(
      t("error.currency_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      { code: data?.code }
    );
  }

  const result = await get<{
    unpaid_amount: number;
    unpaid_amount_formatted: string;
  }>({
    url: useUrl(`invoices/unpaid_amount/${invoiceId}`, {
      currency_code: currency.code
    }),
    queryKey: ["invoices", "unpaid_amount", invoiceId, currency.code],
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0
  });

  return {
    currency,
    unpaidAmount: result.unpaid_amount,
    unpaidAmountFormatted: result.unpaid_amount_formatted
  };
}

/**
 * Assigns (or, with `null`, clears) the payment method for this invoice.
 * `payment_details_id: null` is serialised as a PRESENT key when clearing — the
 * caller passes the whole model through untouched, never `omitBy(isNil)`'d
 * (design D1). Legacy oracle: `invoiceChangePaymentMethodModal.vue`.
 */
export function updatePaymentDetails(
  invoiceId: Invoice["id"],
  model: InvoicePaymentDetailsModel
): Promise<unknown> {
  const { patch, useUrl } = useQuery();

  return patch({
    mutationKey: ["invoices", invoiceId, "payment_details"],
    url: useUrl(`invoices/${invoiceId}/payment_details`),
    data: model,
    withAccessToken: true
  });
}

/**
 * The invoice PDF download — `GET invoices/{id}/download` as a blob (`oracle:
 * pdfs.ts:16-24,28-41`; `invoiceProvider.vue:448-475`). Credit notes are
 * invoices with a different `category` and ride the SAME reader (no branch).
 * The caller (`useInvoice.ts`) derives the save filename from the already-loaded
 * invoice's `number`.
 */
export async function downloadPdf(invoiceId: Invoice["id"]): Promise<Blob> {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser } = useActiveSession().useContext();
  const { download, useUrl } = useQuery();

  if (!isAuthenticated.value || !activeUser.value?.id) {
    throw new NotAuthenticatedError();
  }

  return download({
    url: useUrl(`invoices/${invoiceId}/download`),
    withAccessToken: true
  });
}

/**
 * Re-reads the invoice after a captured payment (the `available.refreshing`
 * state's only caller), then invalidates the sibling caches a payment mutates —
 * the order read (`["order", id]`) and the invoice list (`["invoices"]`) — so a
 * host page underneath refetches its now-stale, pre-payment cache.
 */
async function refresh(
  context: InvoicePayContext,
  event: AnyEventObject
): Promise<InvoiceLookups> {
  const invoice = await loadLookups(context, event);
  await invalidateQueryByKey(["order", context.invoiceId], { exact: false })();
  await invalidateQueryByKey(["invoices"], { exact: false })();
  return invoice;
}

export default {
  convertCurrency,
  loadLookups,
  refresh,
  isAuthenticated: () => useActiveSession().useActions().isReady()
};
