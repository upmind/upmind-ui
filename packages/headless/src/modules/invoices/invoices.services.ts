/** @internal */
import { keepPreviousData } from "@tanstack/vue-query";
import { computed, ref, unref, watch } from "vue";
import {
  InvoiceCategoryCode,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useLocale } from "../system-localisation";
import {
  mapInvoice,
  mapContractLookupItems,
  mapContractProductLookupItems,
  mapInvoiceLookupItems,
  mapInvoices,
  mapUnpaidAmount
} from "./invoices.mappers";
import {
  useContractProductsQuerySchema,
  useContractsQuerySchema,
  useQuerySchema
} from "./invoices.schemas";
import { InvoicesContextTypes } from "./invoices.types";
import { scopeWireParams } from "./invoices.utils";
import {
  useTime,
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  DEBOUNCE_DELAY
} from "../../utils";
import type { LookupItem } from "../lookup";
import type { ScopeContext } from "../scope";
import type {
  Invoice,
  ContractLookupQuery,
  ContractLookupQueryModel,
  ContractProductLookupQuery,
  ContractProductLookupQueryModel,
  InvoiceLookupQuery,
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
import type {
  IContract,
  IContractProduct,
  IInvoice
} from "@upmind-automation/types";
import type { MaybeRef, Ref } from "vue";
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

/** The contract products a `.for('contracts_product', id)` picker offers; minted on the picker's first call. */
function loadContractProductLookup(
  scopeContext: ScopeContext | undefined
): ContractProductLookupQuery {
  const { listInfinite, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return listInfinite<
    IContractProduct[],
    LookupItem[],
    ContractProductLookupQueryModel
  >({
    criteria: { schema: useContractProductsQuerySchema() },
    queryKey: [
      ...queryKey,
      "lookups",
      "contract-products",
      { client: clientId }
    ],
    url: useUrl("contracts_products", {
      client_id: clientId.value,
      with: "product",
      exclude_delegated: 1
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
    select: mapContractProductLookupItems,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  }) as unknown as ContractProductLookupQuery;
}

/** The contracts a `.for('contract', id)` picker offers. */
function loadContractLookup(
  scopeContext: ScopeContext | undefined
): ContractLookupQuery {
  const { listInfinite, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return listInfinite<IContract[], LookupItem[], ContractLookupQueryModel>({
    criteria: { schema: useContractsQuerySchema() },
    queryKey: [...queryKey, "lookups", "contracts", { client: clientId }],
    url: useUrl("contracts", { client_id: clientId.value }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    select: mapContractLookupItems,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  }) as unknown as ContractLookupQuery;
}

/** The list. The scope's client and relationship ride as static url params, as the legacy portal sends them. */
function loadList(scopeContext?: ScopeContext): InvoicesListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return list<IInvoice[], Invoice[], InvoiceQueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId, scope: scopeContext }],
    url: useUrl("invoices", {
      client_id: clientId.value,
      ...scopeWireParams(scopeContext),
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

/** The parent invoices a `.for('invoice', id)` picker offers. */
function loadInvoiceLookup(
  scopeContext: ScopeContext | undefined
): InvoiceLookupQuery {
  const { listInfinite, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return listInfinite<IInvoice[], LookupItem[], InvoiceQueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, "lookups", "invoices", { client: clientId }],
    url: useUrl("invoices", { client_id: clientId.value }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    select: mapInvoiceLookupItems,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  }) as unknown as InvoiceLookupQuery;
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
      unpaid_amount_formatted: string;
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
    // The currency gates the read as hard as the session does: this endpoint
    // 422s without an explicit one (the recorded control response
    // `get-invoices-unpaid-amount-id-case-missing-currency.json`), so firing
    // before `useInvoice` has seeded the invoice's own currency spends a
    // request that can only fail. The seed lands when the single read
    // settles, and re-keying on it is what issues the real call.
    enabled: () =>
      !!invoiceId && isAddressable(clientId.value) && !!currency.value,
    select: mapUnpaidAmount,
    staleTime: 0
  });
}

/**
 * AC10 — one row of the client's unpaid invoices; `hasUnpaid` reads the
 * total. `requested` defers the read until `useMeta().hasUnpaid` is consumed.
 */
function loadUnpaidExistence(
  requested: Ref<boolean>,
  scopeContext?: ScopeContext
): InvoicesListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return list<IInvoice[], Invoice[], InvoiceQueryModel>({
    criteria: {
      schema: useQuerySchema(),
      model: {
        filters: {
          "status.code": InvoiceStatusGroups.UNPAID,
          client_id: clientId.value
        },
        pagination: { limit: 1 }
      }
    },
    queryKey: [
      ...queryKey,
      "unpaid_existence",
      { client: clientId, scope: scopeContext }
    ],
    url: useUrl("invoices", scopeWireParams(scopeContext)),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => requested.value && isAddressable(clientId.value),
    // No `select`: only `pagination.total` is read.
    staleTime: useTime().DAY
  });
}

/** AC2 — the consolidatable count, over its own criteria so reading it never moves the list. */
function loadConsolidatableCount(
  requested: Ref<boolean>,
  scopeContext?: ScopeContext
): InvoicesListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return list<IInvoice[], Invoice[], InvoiceQueryModel>({
    criteria: {
      schema: useQuerySchema(),
      model: {
        filters: {
          "status.code": InvoiceStatusGroups.UNPAID,
          is_consolidation: false,
          "category.slug": [InvoiceCategoryCode.RECURRENT],
          client_id: clientId.value,
          paid_amount: 0
        },
        pagination: { limit: 1 }
      }
    },
    queryKey: [
      ...queryKey,
      "consolidatable_count",
      { client: clientId, scope: scopeContext }
    ],
    url: useUrl("invoices", scopeWireParams(scopeContext)),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => requested.value && isAddressable(clientId.value),
    // No `select`: only `pagination.total` is read.
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

/**
 * AC A's PDF download — `GET invoices/{id}/download` as a blob (`oracle:
 * pdfs.ts:16-24,28-41`; `invoiceProvider.vue:448-475`). Credit notes are
 * invoices with a different `category` (`design.md`) — this reader takes
 * only an id and never branches on it. Scoped through the SAME
 * `resolveClientId`/`isAddressable` seam every other request in this file
 * uses; the caller (`useInvoice.actions.ts`) derives the save filename from
 * the already-loaded invoice's `number`.
 *
 * @decision
 * what: a hand-rolled `fetch`, not `useQuery().request()`.
 * why: `request()` -> `doFetch` (`query.services.ts:50-61`) unconditionally
 * calls `response.json()` — there is no blob/arraybuffer arm, and
 * `packages/headless/src/modules/query/**` is untouchable (operator ruling
 * 2026-09-08, verbatim "do not chnage any query stuff"). The URL
 * (`useUrl`), the locale param, and the session's own access token are the
 * SAME seam `request()` itself reads, consumed directly rather than
 * re-derived — only the response-body branch a binary payload needs is new.
 * rejected: adding a `responseType` option to `request()`/`doFetch` — the
 * exact query-core change the 2026-09-08 ruling withdraws.
 */
async function downloadPdf(
  invoiceId: Invoice["id"],
  scopeContext?: ScopeContext
): Promise<Blob> {
  const { useUrl } = useQuery();
  const { locale } = useLocale();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) throw new NotAuthenticatedError();

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

/** One services instance per scope; `scopeContext` decides the target client and relationship. */
export const createInvoicesServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): InvoicesServices => {
  const clientId = resolveClientId(scopeContext);
  const unpaidExistenceRequested = ref(false);
  const consolidatableCountRequested = ref(false);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed<ResponseError | undefined>(() => undefined),
    loadList: () => loadList(scopeContext),
    loadInvoiceLookup: () => loadInvoiceLookup(scopeContext),
    loadContractLookup: () => loadContractLookup(scopeContext),
    loadContractProductLookup: () => loadContractProductLookup(scopeContext),
    loadOne: invoiceId => loadOne(invoiceId, scopeContext),
    loadUnpaidAmount: (invoiceId, currencyId) =>
      loadUnpaidAmount(invoiceId, currencyId, scopeContext),
    loadUnpaidExistence: () =>
      loadUnpaidExistence(unpaidExistenceRequested, scopeContext),
    requestUnpaidExistence: () => {
      unpaidExistenceRequested.value = true;
    },
    loadConsolidatableCount: () =>
      loadConsolidatableCount(consolidatableCountRequested, scopeContext),
    requestConsolidatableCount: () => {
      consolidatableCountRequested.value = true;
    },
    updatePaymentDetails,
    downloadPdf: invoiceId => downloadPdf(invoiceId, scopeContext),
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createInvoicesServices;
