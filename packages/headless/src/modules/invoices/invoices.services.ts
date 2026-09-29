/** @internal */
import { keepPreviousData } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { InvoiceStatusGroups } from "@upmind-automation/types";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import {
  mapContractLookupItems,
  mapContractProductLookupItems,
  mapInvoiceLookupItems,
  mapInvoices
} from "./invoices.mappers";
import {
  useContractProductsQuerySchema,
  useContractsQuerySchema,
  useInvoiceLookupQuerySchema,
  useQuerySchema
} from "./invoices.schemas";
import {
  CONSOLIDATABLE_FILTER,
  INVOICE_PARENT_WIRE_PARAM,
  InvoicesContextTypes
} from "./invoices.types";
import { scopeWireParams } from "./invoices.utils";
import { useTime, NotAuthenticatedError, DEBOUNCE_DELAY } from "../../utils";
import type { LookupItem } from "../lookup";
import type { ScopeContext } from "../scope";
import type {
  Invoice,
  ContractLookupQuery,
  ContractLookupQueryModel,
  ContractProductLookupQuery,
  ContractProductLookupQueryModel,
  InvoiceLookupQuery,
  InvoiceLookupQueryModel,
  InvoiceQueryModel,
  InvoicesListQuery,
  InvoicesServices
} from "./invoices.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  IContract,
  IContractProduct,
  IInvoice
} from "@upmind-automation/types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module invoices/invoices.services
 * @description The COLLECTION's services factory — `loadList`,
 * `loadUnpaidExistence`, `loadConsolidatableCount` and the relationship
 * lookups. One identity seam, one cache key, one arm-resolution switch. The
 * single-invoice pay engine has its own services file (`invoice.services.ts`).
 * Model: `client-email-history.services.ts:195-212`.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useInvoices.ts` only (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key. Unchanged from the pre-conversion module. */
export const queryKey: QueryKey = ["invoices"];

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

/**
 * The list. A retargeted client and a relationship ride as static url params, as
 * the legacy portal sends them; the client's OWN list sends no `client_id`, so the
 * platform co-mingles its sub-accounts' invoices (legacy invoicesProvider.vue:79).
 */
function loadList(scopeContext?: ScopeContext): InvoicesListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return list<IInvoice[], Invoice[], InvoiceQueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId, scope: scopeContext }],
    url: useUrl("invoices", {
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

  return listInfinite<IInvoice[], LookupItem[], InvoiceLookupQueryModel>({
    criteria: { schema: useInvoiceLookupQuerySchema() },
    queryKey: [...queryKey, "lookups", "invoices", { client: clientId }],
    // `.for('invoice', id)` lists the credit notes OF an invoice, so the picker
    // offers the invoices that have been credited: the parents. A credit note
    // carries no credited amount, so it never appears. Static like `client_id`;
    // staging: `partial_amount_credited > 0` selects every credit note's parent.
    url: useUrl("invoices", {
      client_id: clientId.value,
      [INVOICE_PARENT_WIRE_PARAM]: 0
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
    select: mapInvoiceLookupItems,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  }) as unknown as InvoiceLookupQuery;
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
        filters: { ...CONSOLIDATABLE_FILTER, client_id: clientId.value },
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
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createInvoicesServices;
