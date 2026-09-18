/** @internal */
import { keepPreviousData } from "@tanstack/vue-query";
import { computed, ref, unref, watch } from "vue";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useLocale } from "../system-localisation";
import {
  mapInvoice,
  mapInvoiceLookupItems,
  mapInvoices,
  mapUnpaidAmount
} from "./invoices.mappers";
import {
  consolidatableCountCriteria,
  createInvoicesSchemas,
  useInvoiceLookupSchema,
  UNPAID_EXISTENCE_CRITERIA
} from "./invoices.schemas";
import { InvoicesContextTypes } from "./invoices.types";
import { resolveFilterSlots, seedFilterSlots } from "./invoices.utils";
import {
  useTime,
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  DEBOUNCE_DELAY
} from "../../utils";
import { forEach, has } from "lodash-es";
import type { LookupItem } from "../lookup";
import type { ScopeContext } from "../scope";
import type {
  DurableFilterSlot,
  Invoice,
  InvoiceFilterModel,
  InvoiceLookupQuery,
  InvoiceLookupQueryModel,
  InvoicePaymentDetailsModel,
  InvoiceItemQuery,
  InvoiceQueryModel,
  InvoiceQuerySchema,
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

/**
 * Wraps a list handle's published `setCriteria` so every RESOLVED slot's
 * column survives a write that OMITS it, whatever `filters` branch a caller
 * replaces (AC12, the AC7 clause, OR-1 (b), blocker H1). `criteria.set` merges
 * at BRANCH level (`useQueryCriteria.ts`: "`set({ filters })` replaces the
 * whole `filters` branch") — a bare `filters` write that omits `client_id`
 * (or a scoped `contracts.id`) would otherwise drop the column: the client
 * re-widens to the READER's own rows while `select` still attributes them
 * against the target, and a `.for('contract', id)` + `filterCreditNotes()`
 * read loses the contract narrowing. A caller that DECLARES a slot's key is
 * left untouched — this seam fills only an ABSENT column.
 *
 * @decision
 * what: intercept every `filters`-branch write reaching the ONE handle this
 * module hands to `useInvoices.actions.ts` (backing the published
 * `setCriteria`, `sortBy`, `filterConsolidatable` and `filterCreditNotes`),
 * and re-assert each resolved slot inside the caller's own `filters` object
 * ONLY when it does not already declare that key. Generalises the former
 * client-only `withDurableClientId` over the slot list so the three
 * relationship columns are kept durable by the SAME seam the client is, rather
 * than a second, competing one.
 * why: the merge semantics live in `useQueryCriteria.set` and are shared
 * platform behaviour every module on `list()` relies on; changing them would
 * change every consumer's semantics. `creditNotesCriteria` is one of two
 * reachable doors (the published `setCriteria` is the other) — wrapping the
 * one shared handle closes both, for every slot, so no caller-spelled request
 * can silently drop a scoped column. The presence check (never unconditional
 * override) preserves `setCriteria`'s own manual-retarget door.
 * rejected:
 * - fix `useQueryCriteria.set` to merge `filters` at key level: blocked by
 * operator ruling 2026-09-08 (verbatim, "do not chnage any query stuff") —
 * `packages/headless/src/modules/query/**` stays untouched.
 * - patch only `creditNotesCriteria` to re-carry the slots: leaves the
 * published `setCriteria` — the other reachable door — open.
 * - unconditionally re-assert a slot regardless of presence: breaks the
 * manual-retarget door, which must let an explicit caller-declared key win.
 */
function withDurableFilterSlots(
  handle: InvoicesListQuery,
  slots: DurableFilterSlot[]
): InvoicesListQuery {
  const setCriteria: InvoicesListQuery["setCriteria"] = next => {
    if (!has(next, "filters")) {
      handle.setCriteria(next);
      return;
    }
    const durable: InvoiceFilterModel = {};
    forEach(slots, slot => {
      const value = unref(slot.value);
      // Truthiness, not presence — a declared-but-undefined key (e.g.
      // `consolidatableCriteria(undefined)`'s `client_id`) is not a caller
      // retarget, so this seam still fills it.
      if (value && !next.filters?.[slot.key]) durable[slot.key] = value;
    });
    handle.setCriteria({ ...next, filters: { ...next.filters, ...durable } });
  };

  return { ...handle, setCriteria };
}

/**
 * COLLECTION — the reactive list query, minted once per scope. The whole
 * request state is the DECLARED query schema: `list()` builds the criteria
 * from it and publishes filters/sort/pagination back on the handle, so there
 * is no raw `sort`/`filters`/`pagination` param beside it (AC2).
 *
 * {@link seedFilterSlots} seeds and keeps each resolved slot's filter column
 * in step with its source — the `client_id` follows the resolved scope target
 * (AC12, the AC7 clause: without it a `.for('client', X)` scope fetched the
 * READER's own rows while `select` still attributed them against `X`
 * (`mapInvoices` below), corrupting `Invoice.attribution`/`isSettleable`), and
 * a `.for('contract'|'contracts_product'|'invoice', id)` relationship seeds its
 * own column (FE-3031 F3, OR-1).
 *
 * {@link withDurableFilterSlots} then makes each column DURABLE across every
 * published criteria write, not just the mint-time seed — blocker H1, OR-1 (b).
 */
function loadList(
  useQuerySchema: () => InvoiceQuerySchema,
  scopeContext?: ScopeContext
): InvoicesListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  const handle = list<IInvoice[], Invoice[], InvoiceQueryModel>({
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

  const slots = resolveFilterSlots(clientId, scopeContext);
  seedFilterSlots(handle, slots);

  return withDurableFilterSlots(handle, slots);
}

/**
 * The async invoice lookup — the PARENT invoices a `.for('invoice', id)` scope
 * slot takes. Client-scoped, search-driven, and lazy: `isActive` defers the
 * first fetch to the control's own read, so the query stays idle until a
 * picker opens it. Sibling of the contract-product lookup in `client-notes`.
 */
function loadInvoiceLookup(
  scopeContext: ScopeContext | undefined,
  isActive: Ref<boolean>
): InvoiceLookupQuery {
  const { listInfinite, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  const targetUrl = () =>
    useUrl("invoices", { "filter[client_id]": clientId.value });
  const url = targetUrl();

  return listInfinite<IInvoice[], LookupItem[], InvoiceLookupQueryModel>({
    criteria: { schema: useInvoiceLookupSchema() },
    queryKey: [...queryKey, "lookups", "invoices", { client: clientId }],
    url,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        url.search = targetUrl().search;
        resolve(true);
      }),
    withAccessToken: true,
    select: mapInvoiceLookupItems,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value) && isActive.value
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
 * AC10's unpaid-existence count read — the same `loadList` shape, seeded with
 * the fixed {@link UNPAID_EXISTENCE_CRITERIA} preset (`oracle:553-572`). No
 * relations: count only.
 *
 * `requested` gates `enabled`: the query is minted once, alongside the list
 * query, but stays disabled until `requestUnpaidExistence()` flips it —
 * `meta.hasUnpaid` calls that on read, so an `useInvoices()` scope that never
 * asks about `hasUnpaid` never issues this request.
 *
 * {@link trackClientIdFilter} seeds `client_id` onto this read the same way
 * the oracle conditionally does (`oracle:561-563` —
 * `...(payload.clientId ? { ["filter[client_id]"]: payload.clientId } : {})`):
 * without it this read answered for the READER, so
 * `.for('client', X).useMeta().hasUnpaid` reported a sub-account's own
 * outstanding invoices as `false`.
 */
function loadUnpaidExistence(
  useQuerySchema: () => InvoiceQuerySchema,
  requested: Ref<boolean>,
  scopeContext?: ScopeContext
): InvoicesListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  const handle = list<IInvoice[], Invoice[], InvoiceQueryModel>({
    criteria: { schema: useQuerySchema(), model: UNPAID_EXISTENCE_CRITERIA },
    queryKey: [...queryKey, "unpaid_existence", { client: clientId }],
    url: useUrl("invoices"),
    withAccessToken: true,
    // `requested` is NOT part of the guard: "nobody has asked for this count
    // yet" is not an authentication failure, and manufacturing one here put a
    // `NotAuthenticatedError` on the handle that `useMeta().hasError` folds
    // into the COLLECTION's error — so an unasked notice read presented as
    // "Something went wrong" over the whole list. `enabled` below owns that
    // gate; the guard answers only whether the read is addressable at all.
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => requested.value && isAddressable(clientId.value),
    // NO `select`: this read answers a COUNT and nothing else — `hasUnpaid` and
    // `consolidatableCount` read `pagination.total`, never a row. `list()`
    // applies `select` INSIDE its queryFn, so a mapper that throws on one live
    // row rejects the whole query: the network shows 200 with the real total,
    // the handle reports an error, `pagination.total` falls back to 0, and
    // `useMeta().hasError` folds that into the COLLECTION's error. Mapping rows
    // nobody reads can only lose.
    staleTime: useTime().DAY
  });

  seedFilterSlots(handle, resolveFilterSlots(clientId, scopeContext));

  return handle;
}

/**
 * AC2's dedicated consolidatable-count read — the same `list()` shape as
 * {@link loadUnpaidExistence}, seeded with `consolidatableCountCriteria`
 * (`invoices.schemas.ts`) so the notice/CTA count is served from ITS OWN
 * criteria object and query key, never the one `filterConsolidatable()`
 * mutates on the list query (`useInvoices.actions.ts`) — the two coexist.
 *
 * `requested` gates `enabled` exactly like `loadUnpaidExistence`:
 * `meta.consolidatableCount` flips it on read, so a scope nobody asks about
 * never issues this request.
 *
 * The `client_id` this seeds at mint (via `consolidatableCountCriteria`)
 * would otherwise freeze whatever `clientId.value` resolved to at
 * construction (W2); {@link trackClientIdFilter} re-applies it on every
 * change, so a self-scope's client_id tracks a session switch instead.
 */
function loadConsolidatableCount(
  useQuerySchema: () => InvoiceQuerySchema,
  requested: Ref<boolean>,
  scopeContext?: ScopeContext
): InvoicesListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  const handle = list<IInvoice[], Invoice[], InvoiceQueryModel>({
    criteria: {
      schema: useQuerySchema(),
      model: consolidatableCountCriteria(clientId.value)
    },
    queryKey: [...queryKey, "consolidatable_count", { client: clientId }],
    url: useUrl("invoices"),
    withAccessToken: true,
    // `requested` is NOT part of the guard: "nobody has asked for this count
    // yet" is not an authentication failure, and manufacturing one here put a
    // `NotAuthenticatedError` on the handle that `useMeta().hasError` folds
    // into the COLLECTION's error — so an unasked notice read presented as
    // "Something went wrong" over the whole list. `enabled` below owns that
    // gate; the guard answers only whether the read is addressable at all.
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => requested.value && isAddressable(clientId.value),
    // NO `select`: this read answers a COUNT and nothing else — `hasUnpaid` and
    // `consolidatableCount` read `pagination.total`, never a row. `list()`
    // applies `select` INSIDE its queryFn, so a mapper that throws on one live
    // row rejects the whole query: the network shows 200 with the real total,
    // the handle reports an error, `pagination.total` falls back to 0, and
    // `useMeta().hasError` folds that into the COLLECTION's error. Mapping rows
    // nobody reads can only lose.
    staleTime: useTime().DAY
  });

  seedFilterSlots(handle, resolveFilterSlots(clientId, scopeContext));

  return handle;
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

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useInvoices.ts` calls it once and so does
 * `useInvoice.ts`, each with ITS OWN resolved scope, so the two instances
 * share no mutable state.
 *
 * Resolves `useQuerySchema` once, through `createInvoicesSchemas`, so this
 * services file and the query-issuing reads below never re-derive their own
 * copy of the arm-resolution switch (`invoices.schemas.ts`'s own factory) —
 * the same seam `scopedServices` below already routes `scopeActor` through.
 */
export const createInvoicesServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): InvoicesServices => {
  const { useQuerySchema } = createInvoicesSchemas(scopeActor);
  const clientId = resolveClientId(scopeContext);
  const unpaidExistenceRequested = ref(false);
  const consolidatableCountRequested = ref(false);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed<ResponseError | undefined>(() => undefined),
    loadList: () => loadList(useQuerySchema, scopeContext),
    loadInvoiceLookup: isActive => loadInvoiceLookup(scopeContext, isActive),
    loadOne: invoiceId => loadOne(invoiceId, scopeContext),
    loadUnpaidAmount: (invoiceId, currencyId) =>
      loadUnpaidAmount(invoiceId, currencyId, scopeContext),
    loadUnpaidExistence: () =>
      loadUnpaidExistence(
        useQuerySchema,
        unpaidExistenceRequested,
        scopeContext
      ),
    requestUnpaidExistence: () => {
      unpaidExistenceRequested.value = true;
    },
    loadConsolidatableCount: () =>
      loadConsolidatableCount(
        useQuerySchema,
        consolidatableCountRequested,
        scopeContext
      ),
    requestConsolidatableCount: () => {
      consolidatableCountRequested.value = true;
    },
    updatePaymentDetails,
    downloadPdf: invoiceId => downloadPdf(invoiceId, scopeContext),
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createInvoicesServices;
