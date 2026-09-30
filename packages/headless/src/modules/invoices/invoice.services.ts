/** @internal */
import { useBasketCurrency } from "../basket";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useLocale } from "../system-localisation";
import { mapUnpaidAmount } from "./invoices.mappers";
import { DetailedError, ErrorOrigin, NotAuthenticatedError } from "../../utils";
import { isEmpty } from "lodash-es";
import type {
  Invoice,
  InvoicePayContext,
  InvoicePaymentDetailsModel,
  InvoiceUnpaidAmount,
  InvoiceUnpaidAmountQuery
} from "./invoices.types";
import type { IInvoice } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
/**
 * @module invoices/invoice.services
 * @description Services for the single-invoice pay orchestrator machine, plus
 * the reads and writes the single invoice owns: the live unpaid-amount read
 * (`GET invoices/unpaid_amount/{id}`), the payment-method assignment
 * (`PATCH invoices/{id}/payment_details`) and the PDF download
 * (`GET invoices/{id}/download`). Self only — client and guest read their own
 * invoice through the session.
 */

async function loadLookups(
  { invoiceId }: InvoicePayContext,
  _event: AnyEventObject
): Promise<IInvoice> {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser } = useActiveSession().useContext();
  const { get, useUrl } = useQuery();

  if (!isAuthenticated.value || !activeUser.value?.id) {
    throw new NotAuthenticatedError();
  }

  return get<IInvoice>({
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
}

/**
 * The invoice's live unpaid amount, converted to the client's selected
 * currency. The currency rides through the query layer's `withCurrency`
 * (finding 12 — NOT a manual `url.searchParams` write): it reads the basket
 * currency and re-keys the query on a change, so switching the payment currency
 * re-reads the converted amount (`invoicePaymentModal.vue:502`,
 * `invoiceStatusMsg.vue:184-205`). The endpoint 422s without a currency, so the
 * read is gated on one being set.
 */
export function loadUnpaidAmount(
  invoiceId: Invoice["id"]
): InvoiceUnpaidAmountQuery {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser } = useActiveSession().useContext();
  const { currencyCode } = useBasketCurrency();
  const { query, useUrl } = useQuery();

  return query<
    { unpaid_amount: number; unpaid_amount_formatted: string },
    InvoiceUnpaidAmount
  >({
    queryKey: ["invoices", "unpaid_amount", invoiceId],
    url: useUrl(`invoices/unpaid_amount/${invoiceId}`),
    withAccessToken: true,
    withCurrency: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!invoiceId || !isAuthenticated.value || !activeUser.value?.id) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () =>
      !!invoiceId &&
      isAuthenticated.value &&
      !!activeUser.value?.id &&
      !isEmpty(currencyCode.value),
    select: mapUnpaidAmount,
    staleTime: 0
  });
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
 *
 * @decision
 * what: a hand-rolled `fetch`, not `useQuery().request()`.
 * why: `request()` -> `doFetch` (`query.services.ts:50-61`) unconditionally
 * calls `response.json()` — there is no blob/arraybuffer arm, and
 * `packages/headless/src/modules/query/**` is untouchable (operator ruling
 * 2026-09-08, verbatim "do not chnage any query stuff"). The URL (`useUrl`),
 * the locale param, and the session's own access token are the SAME seam
 * `request()` itself reads, consumed directly rather than re-derived — only the
 * response-body branch a binary payload needs is new.
 * rejected: adding a `responseType` option to `request()`/`doFetch` — the exact
 * query-core change the 2026-09-08 ruling withdraws.
 */
export async function downloadPdf(invoiceId: Invoice["id"]): Promise<Blob> {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser } = useActiveSession().useContext();
  const { useUrl } = useQuery();
  const { locale } = useLocale();

  if (!isAuthenticated.value || !activeUser.value?.id) {
    throw new NotAuthenticatedError();
  }

  const url = useUrl(`invoices/${invoiceId}/download`);
  if (locale.value) url.searchParams.set("lang", locale.value as string);

  const token = await useActiveSession()
    .useActions()
    .isReady()
    .then(() => useActiveSession().useContext().session.value?.access_token);

  const response = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new DetailedError(
      body?.error?.message ?? response.statusText,
      response.status,
      ErrorOrigin.Headless,
      body?.error?.data
    );
  }

  return response.blob();
}

export default {
  loadLookups,
  refresh: loadLookups, // alias
  isAuthenticated: () => useActiveSession().useActions().isReady()
};
