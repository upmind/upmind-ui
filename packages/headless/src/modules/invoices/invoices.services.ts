/** @internal */
import { keepPreviousData } from "@tanstack/vue-query";
import { computed, ref, unref, watch } from "vue";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { mapInvoice, mapInvoices, mapUnpaidAmount } from "./invoices.mappers";
import {
  consolidatableCountCriteria,
  createInvoicesSchemas,
  UNPAID_EXISTENCE_CRITERIA
} from "./invoices.schemas";
import { InvoicesContextTypes } from "./invoices.types";
import { useTime, NotAuthenticatedError } from "../../utils";
import { has } from "lodash-es";
import type { ScopeContext } from "../scope";
import type {
  Invoice,
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
import type { ComputedRef, MaybeRef, Ref } from "vue";
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
 * Keeps a list handle's `client_id` filter column tracking the RESOLVED
 * scope target reactively, through the declared criteria column
 * (`setCriteria`) — never a mint-time snapshot (W2): a self-scope's
 * `clientId` follows the active session and can change after construction
 * (e.g. a session switch), and a criteria `model` seed is committed once,
 * at mint, only. Every other declared filter on the handle is preserved —
 * only the `client_id` key is overridden.
 */
function trackClientIdFilter(
  handle: InvoicesListQuery,
  clientId: ComputedRef<string | undefined>
): void {
  watch(
    clientId,
    value =>
      handle.setCriteria({
        filters: {
          ...handle.criteria.value.filters,
          ...(value ? { client_id: { eq: value } } : {})
        }
      }),
    { immediate: true }
  );
}

/**
 * Wraps a list handle's published `setCriteria` so the RESOLVED target's
 * `client_id` column survives every write that OMITS it, whatever `filters`
 * branch a caller replaces (AC12, the A7 clause, blocker H1). `criteria.set`
 * merges at BRANCH level (`useQueryCriteria.ts:100-101`: "`set({ filters })`
 * replaces the whole `filters` branch") — a bare `filters` write that omits
 * `client_id` would otherwise drop the column and re-widen the list to the
 * READER's own rows while `select: raw => mapInvoices(raw, clientId.value)`
 * still attributes them against the target. A caller that DECLARES its own
 * `client_id` (the published `setCriteria`'s own manual-retarget door,
 * `invoices.scope-identity.int.test.ts`) is left untouched — this seam only
 * fills an ABSENT column, it never overrides a present one.
 *
 * @decision
 * what: intercept every `filters`-branch write reaching the handle this
 * module hands to `useInvoices.actions.ts` (the ONE handle backing the
 * published `setCriteria`, `sortBy`, `filterConsolidatable` and
 * `filterCreditNotes`), and re-assert `client_id` inside the caller's own
 * `filters` object ONLY when that object does not already declare the key —
 * never a second, competing `setCriteria` call, never a raw wire param.
 * why: the merge semantics live in `useQueryCriteria.set`
 * (`packages/headless/src/modules/query/useQueryCriteria.ts:111-123`) and
 * are shared platform behaviour every module on `list()` relies on;
 * changing them would change every consumer's semantics, not just this
 * module's. `creditNotesCriteria` is one of two reachable doors (the
 * published `setCriteria` is the other, per `useInvoices.ts`'s own doc
 * example) — patching only the preset leaves the second door open. Wrapping
 * the ONE handle every published verb shares closes both: no caller-spelled
 * request can silently drop the column. The presence check (never
 * unconditional override) preserves `setCriteria`'s own manual-retarget
 * door, where a caller declaring `client_id` explicitly must win.
 * rejected:
 * - fix `useQueryCriteria.set` to merge `filters` at key level: blocked by
 * operator ruling 2026-09-08 (verbatim, "do not chnage any query stuff") —
 * `packages/headless/src/modules/query/**` stays untouched.
 * - patch only `creditNotesCriteria` to carry `client_id`: leaves the
 * published `setCriteria` — AC12's other reachable door — open.
 * - unconditionally re-assert `client_id` regardless of presence: breaks the
 * published `setCriteria`'s own manual-retarget door, which must let an
 * explicit caller-declared `client_id` win.
 * - a bare key-presence check (`has(next.filters, ["client_id"])`): passes
 * for `consolidatableCriteria`'s `client_id: { eq: undefined }`
 * (`invoices.schemas.ts:349`) too — a key with no value is not a caller
 * "declaring" `client_id`. A value-level truthiness check on `.eq` closes
 * that structurally rather than relying on `isAddressable(clientId.value)`
 * happening to keep it unreachable today.
 */
function withDurableClientId(
  handle: InvoicesListQuery,
  clientId: ComputedRef<string | undefined>
): InvoicesListQuery {
  const setCriteria: InvoicesListQuery["setCriteria"] = next => {
    if (
      !has(next, "filters") ||
      !clientId.value ||
      // Array path, not a dotted string: this module's filter keys ("status.code",
      // "contracts.id") are literal, dot-bearing property names, and lodash's
      // string form reads a dot as a nested-path separator. Truthiness, not
      // presence, on `.eq` — a declared-but-undefined `client_id` (e.g.
      // `consolidatableCriteria(undefined)`) is not a caller retarget.
      !!next.filters?.client_id?.eq
    ) {
      handle.setCriteria(next);
      return;
    }
    handle.setCriteria({
      ...next,
      filters: { ...next.filters, client_id: { eq: clientId.value } }
    });
  };

  return { ...handle, setCriteria };
}

/**
 * COLLECTION — the reactive list query, minted once per scope. The whole
 * request state is the DECLARED query schema: `list()` builds the criteria
 * from it and publishes filters/sort/pagination back on the handle, so there
 * is no raw `sort`/`filters`/`pagination` param beside it (AC2).
 *
 * {@link trackClientIdFilter} seeds and keeps the `client_id` filter column
 * in step with the resolved scope target (AC12, the A7 clause): without it,
 * a `.for('client', X)` scope fetched the READER's own rows while `select`
 * still attributed them against `X` (`mapInvoices` below), corrupting
 * `Invoice.attribution`/`isSettleable` for a genuine sub-account row.
 *
 * {@link withDurableClientId} then makes that column DURABLE across every
 * published criteria write, not just the mint-time seed — blocker H1.
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

  trackClientIdFilter(handle, clientId);

  return withDurableClientId(handle, clientId);
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
    enabled: () => !!invoiceId && isAddressable(clientId.value),
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
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!requested.value || !isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => requested.value && isAddressable(clientId.value),
    select: raw => mapInvoices(raw, clientId.value),
    staleTime: useTime().DAY
  });

  trackClientIdFilter(handle, clientId);

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
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!requested.value || !isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => requested.value && isAddressable(clientId.value),
    select: raw => mapInvoices(raw, clientId.value),
    staleTime: useTime().DAY
  });

  trackClientIdFilter(handle, clientId);

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
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createInvoicesServices;
