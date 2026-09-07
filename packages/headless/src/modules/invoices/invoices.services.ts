/** @internal */
import { keepPreviousData } from "@tanstack/vue-query";
import { computed, unref, watch } from "vue";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { mapInvoice, mapInvoices, mapUnpaidAmount } from "./invoices.mappers";
import { UNPAID_EXISTENCE_CRITERIA, useQuerySchema } from "./invoices.schemas";
import { InvoicesContextTypes } from "./invoices.types";
import { useTime, NotAuthenticatedError } from "../../utils";
import type { ScopeContext } from "../scope";
import type {
  Invoice,
  InvoicePaymentDetailsModel,
  InvoiceItemQuery,
  InvoiceQueryModel,
  InvoiceUnpaidAmount,
  InvoiceUnpaidAmountQuery,
  InvoicesListQuery,
  InvoicesServices
} from "./invoices.types";
import type { ResponseError } from "../../utils";
import type { Currency } from "../currency/currency.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IInvoice } from "@upmind-automation/types";
import type { MaybeRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module invoices/invoices.services
 * @description The ONE services file both halves consume — the collection's
 * `loadList`/`loadUnpaidExistence` and the single read's `loadOne`/
 * `loadUnpaidAmount`/`updatePaymentDetails`. One factory on purpose: one
 * identity seam, one cache key, one arm-resolution switch, so the two
 * composables can never disagree about whose invoices are being read. Model:
 * `client-email-history.services.ts:195-212`.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useInvoices.ts` / `useInvoice.ts` only (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key. Unchanged from the pre-conversion module. */
export const queryKey: QueryKey = ["invoices"];

/**
 * `loadOne`'s include set — the pre-conversion 17 relations are the FLOOR and
 * may not shrink, plus the nine `design.md` names (R05, AC4, AC7, AC8, AC13).
 * `address,address.country` fixes a live bug: `invoices.mappers.ts` has always
 * mapped `raw.address`, but the relation was never requested, so the mapped
 * address was always `undefined`.
 */
const LOAD_ONE_INCLUDES = [
  "brand",
  "taxes",
  "client",
  "status",
  "contract",
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
  "account.affiliate_referral.affiliate_account.account.client",
  "address",
  "address.country",
  "category",
  "payments.gateway",
  "payments.payment_type",
  "payment_details",
  "gateway",
  "client.parent_client_config",
  "last_payment_log"
].join(",");

/**
 * `loadList`'s include set — the oracle's own leaner list set (`oracle:47-64`)
 * plus `category` and `client.parent_client_config`.
 */
const LOAD_LIST_INCLUDES = [
  "client",
  "client.image",
  "client.parent_client_config",
  "brand",
  "status",
  "category",
  "products",
  "last_payment_log"
].join(",");

/**
 * Derives the target client from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares.
 *
 * Compares the CONTEXT the scope builder resolved, never the actor (variance-
 * law clause 4). Model: `client-email-history.services.ts:59-67`.
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === InvoicesContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/**
 * The ONE addressability predicate every request gate in this file calls, and
 * the predicate `InvoicesServices.isAvailable` republishes reactively so the
 * flag a consumer renders and the gate the wire enforces cannot drift apart.
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * COLLECTION — the reactive list query, minted once per scope. The whole
 * request state is the DECLARED query schema: `list()` builds the criteria
 * from it and publishes filters/sort/pagination back on the handle, so there
 * is no raw `sort`/`filters`/`pagination` param beside it (AC2).
 */
function loadList(scopeContext?: ScopeContext): InvoicesListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return list<IInvoice[], Invoice[], InvoiceQueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId }],
    url: useUrl("invoices", {
      with: LOAD_LIST_INCLUDES,
      with_count: "products"
    }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => isAddressable(clientId.value),
    select: raw => mapInvoices(raw, clientId.value),
    staleTime: useTime().DAY,
    placeholderData: keepPreviousData
  });
}

/**
 * SINGLE READ — the reactive item query, minted once per scope. Replaces the
 * pre-conversion `loadInvoice`. An absent id issues NO request.
 */
function loadOne(
  invoiceId?: Invoice["id"],
  scopeContext?: ScopeContext
): InvoiceItemQuery {
  const { query, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return query<IInvoice, Invoice>({
    queryKey: [...queryKey, "invoice", invoiceId, { client: clientId }],
    url: useUrl(`invoices/${invoiceId}`, {
      with: LOAD_ONE_INCLUDES,
      with_count: "products"
    }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!invoiceId || !isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => !!invoiceId && isAddressable(clientId.value),
    select: raw => mapInvoice(raw, clientId.value),
    staleTime: useTime().DAY
  });
}

/**
 * AC1's standalone live re-read. `currencyId` rides as a plain query param —
 * a single read has no criteria channel — and in the query key, so a currency
 * change re-keys the query rather than serving the prior response
 * (`oracle:621-633`). `staleTime: 0` for the same reason.
 */
function loadUnpaidAmount(
  invoiceId?: Invoice["id"],
  currencyId?: MaybeRef<Currency["id"] | undefined>,
  scopeContext?: ScopeContext
): InvoiceUnpaidAmountQuery {
  const { query, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);
  const currency = computed(() => unref(currencyId));

  const url = useUrl(`invoices/unpaid_amount/${invoiceId}`);
  // The wire param is mutated in place on a currency change, so the fetch
  // the query-key change below triggers carries it — a plain GET has no
  // criteria channel to route this through instead.
  watch(
    currency,
    value => {
      if (value) url.searchParams.set("currency_id", value);
      else url.searchParams.delete("currency_id");
    },
    { immediate: true }
  );

  return query<
    {
      unpaid_amount: number;
      unpaid_amount_converted: number;
      unpaid_amount_formatted: string;
      currency_id: string;
    },
    InvoiceUnpaidAmount
  >({
    queryKey: [
      ...queryKey,
      "unpaid_amount",
      invoiceId,
      { client: clientId, currency }
    ],
    url,
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!invoiceId || !isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => !!invoiceId && isAddressable(clientId.value),
    select: mapUnpaidAmount,
    staleTime: 0
  });
}

/**
 * AC10's unpaid-existence count read — the same `loadList` shape, seeded with
 * the fixed {@link UNPAID_EXISTENCE_CRITERIA} preset (`oracle:553-572`). No
 * relations: count only.
 */
function loadUnpaidExistence(scopeContext?: ScopeContext): InvoicesListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return list<IInvoice[], Invoice[], InvoiceQueryModel>({
    criteria: { schema: useQuerySchema(), model: UNPAID_EXISTENCE_CRITERIA },
    queryKey: [...queryKey, "unpaid_existence", { client: clientId }],
    url: useUrl("invoices"),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => isAddressable(clientId.value),
    select: raw => mapInvoices(raw, clientId.value),
    staleTime: useTime().DAY
  });
}

/**
 * AC4's assigned-method writer. `payment_details_id: null` is serialised as a
 * PRESENT key when clearing — the caller passes the whole model through
 * untouched, never `omitBy(isNil)`'d (design D1).
 */
function updatePaymentDetails(
  invoiceId: Invoice["id"],
  model: InvoicePaymentDetailsModel
): Promise<unknown> {
  const { patch, useUrl } = useQuery();

  return patch({
    mutationKey: [...queryKey, invoiceId, "payment_details"],
    url: useUrl(`invoices/${invoiceId}/payment_details`),
    data: model,
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Arm-resolution switch: only its `default:` case exists (arms: none). One
 * non-dropped actor (`client`) resolves after the staff deprecation, so there
 * is no second implementation for any actor to diverge from — the
 * `client x self` / `client x client` difference is the CONTEXT
 * `resolveClientId` resolves, not a per-actor member (`parity.yaml` "arms").
 */
function scopedServices(
  _scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<InvoicesServices> {
  switch (_scopeActor) {
    default:
      return {};
  }
}

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useInvoices.ts` calls it once and so does
 * `useInvoice.ts`, each with ITS OWN resolved scope, so the two instances
 * share no mutable state.
 *
 * `scopeActor` is unused today — with a single resolving actor (`client`) in
 * both matrices (design D6), there is no per-actor member to select. Kept in
 * the signature so a future arm can switch on it without a call-site change.
 */
export const createInvoicesServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): InvoicesServices => {
  const clientId = resolveClientId(scopeContext);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed<ResponseError | undefined>(() => undefined),
    loadList: () => loadList(scopeContext),
    loadOne: invoiceId => loadOne(invoiceId, scopeContext),
    loadUnpaidAmount: (invoiceId, currencyId) =>
      loadUnpaidAmount(invoiceId, currencyId, scopeContext),
    loadUnpaidExistence: () => loadUnpaidExistence(scopeContext),
    updatePaymentDetails,
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createInvoicesServices;
