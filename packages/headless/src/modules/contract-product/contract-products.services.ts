/** @internal */
import { until } from "@vueuse/core";
import { toRef } from "vue";
import { useBrand } from "../brand";
import { usePersonalDetails } from "../client-personal-details";
import { useQuery } from "../query";
import { ScopeActorTypes } from "../scope/scope.types";
import { resolveClientId, useActiveSession } from "../session-store";
import {
  mapContractProductPickerItem,
  mapContractProducts
} from "./contract-product.mappers";
import {
  useContractProductPickerQuerySchema,
  useGroupedCountsQuerySchema,
  useQuerySchema
} from "./contract-product.schemas";
import { ContractProductsContextTypes } from "./contract-product.types";
import { resolveExcludeDelegated } from "./contract-product.utils";
import { DEBOUNCE_DELAY, NotAuthenticatedError, useTime } from "../../utils";
import { isArray, join, map, reject, startsWith } from "lodash-es";
import type {
  ContractProduct,
  ContractProductGroupedCountsQuery,
  ContractProductListQuery,
  ContractProductPickerLookupQuery,
  ContractProductPickerQueryModel,
  ContractProductsServices,
  ExcludeDelegatedRead,
  QueryModel
} from "./contract-product.types";
import type { LookupItem } from "../lookup";
import type { ScopeContext } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  ICProdGroup,
  IContractProduct,
  IProductCategory
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-products.services
 * @description The collection's services: the list, the grouped counts, the
 * purchased categories and the product picker's lookup. The manager's
 * services are in `contract-product.services.ts`.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContractProducts.ts` only (`@internal/no-cross-module-imports`).
 */

/** The module's base cache key. Every write invalidates it whole. */
export const queryKey: QueryKey = ["contracts"];

const CONTRACT_PRODUCTS_LIST_WITH: string[] = [
  "clients",
  "clients.image",
  "clients.brand",
  "status",
  "product.image",
  "brand.currency",
  "product.provision_blueprint",
  "product.provision_blueprint.category",
  "contract_request",
  "future_cancellation_request",
  "moved_to_contract_product",
  "moved_to_contract_product.clients",
  "tags"
];

const LIST_URL_PARAMS = {
  with: join(CONTRACT_PRODUCTS_LIST_WITH, ","),
  split_count: 1
};

const CONTRACT_PRODUCTS_GROUPED_WITH = join(
  reject(CONTRACT_PRODUCTS_LIST_WITH, member => startsWith(member, "clients")),
  ","
);

/**
 * The `exclude_delegated` flag a read sends, from the client's stored
 * preference, and whether that preference is still being read. A delegated
 * context reads no preference.
 */
function useExcludeDelegated(
  scopeContext?: ScopeContext
): ExcludeDelegatedRead {
  const { hasDelegatedProducts } = useActiveSession().useMeta();
  const details =
    scopeContext?.type === ContractProductsContextTypes.DELEGATED
      ? undefined
      : usePersonalDetails().as(ScopeActorTypes.CLIENT);
  const preference = details?.useContext().model;

  return {
    excludeDelegated: toRef(() =>
      resolveExcludeDelegated(
        scopeContext,
        preference?.value?.excludeDelegatedProducts,
        hasDelegatedProducts.value
      )
    ),
    isPreferenceLoading: details?.useMeta().isLoading
  };
}

/**
 * The reactive list query. The key carries the refs, so a late client id or a
 * changed preference re-keys into its own cache entry; the guard re-points the
 * URL at the preference once it is read.
 */
function loadList(scopeContext?: ScopeContext): ContractProductListQuery {
  const { list, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();
  const clientId = resolveClientId(scopeContext);
  const { excludeDelegated, isPreferenceLoading } =
    useExcludeDelegated(scopeContext);
  const url = useUrl("contracts_products", LIST_URL_PARAMS);

  return list<IContractProduct[], ContractProduct[], QueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [
      ...queryKey,
      { client: clientId },
      "products",
      { excludeDelegated }
    ],
    url,
    guard: async () => {
      if (!isAuthenticated.value || !clientId.value)
        throw new NotAuthenticatedError();
      if (isPreferenceLoading?.value)
        await until(isPreferenceLoading).toBe(false);
      url.searchParams.set("exclude_delegated", `${excludeDelegated.value}`);
      return true;
    },
    withAccessToken: true,
    withSplitCount: true,
    select: raw => mapContractProducts(raw, useBrand().taxType.value),
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () =>
      isAuthenticated.value && !!clientId.value && !isPreferenceLoading?.value
  });
}

/**
 * The dashboard's grouped counts, with no `exclude_delegated`. `limit=count`
 * is the platform's count mode: it returns no rows and carries the grouped
 * rows on the envelope's `total`. The query runs when it is refetched.
 */
function loadGroupedCounts(
  scopeContext?: ScopeContext
): ContractProductGroupedCountsQuery {
  const { query, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();
  const clientId = resolveClientId(scopeContext);
  const target = (): URL =>
    useUrl(`clients/${clientId.value}/contracts/products`, {
      limit: "count",
      group_count: "products.category_id,service_identifier",
      with: CONTRACT_PRODUCTS_GROUPED_WITH
    });
  const url = target();

  return query<IContractProduct[], ICProdGroup[]>({
    criteria: { schema: useGroupedCountsQuerySchema() },
    queryKey: [...queryKey, { client: clientId }, "grouped-counts"],
    url,
    guard: async () => {
      if (!isAuthenticated.value || !clientId.value)
        throw new NotAuthenticatedError();
      url.pathname = target().pathname;
      return true;
    },
    select: (_data, response) => {
      const groups: unknown = response.total;
      return isArray(groups) ? groups : [];
    },
    withAccessToken: true,
    enabled: false
  });
}

/** The purchased categories, read with the list's `exclude_delegated` once the preference is read. */
async function loadPurchasedCategories(
  scopeContext?: ScopeContext
): Promise<IProductCategory[]> {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();
  const clientId = resolveClientId(scopeContext);
  const { excludeDelegated, isPreferenceLoading } =
    useExcludeDelegated(scopeContext);

  if (!isAuthenticated.value || !clientId.value) {
    return Promise.reject(new NotAuthenticatedError());
  }
  if (isPreferenceLoading?.value) await until(isPreferenceLoading).toBe(false);

  return get<IProductCategory[], IProductCategory[]>({
    queryKey: [
      ...queryKey,
      { client: clientId.value },
      "categories",
      { excludeDelegated: excludeDelegated.value }
    ],
    url: useUrl("contract_product_categories", {
      exclude_delegated: excludeDelegated.value
    }),
    withAccessToken: true
  });
}

/**
 * The `contractProductPicker`'s own lookup: the client's own contract
 * products, searched by service identifier, with the list's
 * `exclude_delegated`. The guard waits for the preference, then sets the
 * client and the preference when the request is sent.
 */
function loadContractProductLookup(
  scopeContext?: ScopeContext
): ContractProductPickerLookupQuery {
  const { listInfinite, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();
  const clientId = resolveClientId(scopeContext);
  const { excludeDelegated, isPreferenceLoading } =
    useExcludeDelegated(scopeContext);
  const url = useUrl("contracts_products");

  return listInfinite<
    IContractProduct[],
    LookupItem[],
    ContractProductPickerQueryModel
  >({
    criteria: { schema: useContractProductPickerQuerySchema() },
    queryKey: [
      ...queryKey,
      "lookups",
      "contract-products",
      { client: clientId },
      { excludeDelegated }
    ],
    url,
    withAccessToken: true,
    guard: async () => {
      if (!isAuthenticated.value || !clientId.value)
        throw new NotAuthenticatedError();
      if (isPreferenceLoading?.value)
        await until(isPreferenceLoading).toBe(false);
      url.searchParams.set("client_id", clientId.value);
      url.searchParams.set("exclude_delegated", `${excludeDelegated.value}`);
      return true;
    },
    select: (raw = []) => map(raw, mapContractProductPickerItem),
    retryDelay: DEBOUNCE_DELAY,
    enabled: () =>
      isAuthenticated.value && !!clientId.value && !isPreferenceLoading?.value
  });
}

// -----------------------------------------------------------------------------
// Service Factory

/** Maps a scope actor to its service overrides. Armless today. */
function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ContractProductsServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory: the concrete actor and the context it acts upon arrive at
 * construction. `useContractProducts.ts` calls it once per scope.
 */
export const createContractProductsServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ContractProductsServices => ({
  queryKey,
  loadList: () => loadList(scopeContext),
  loadGroupedCounts: () => loadGroupedCounts(scopeContext),
  loadPurchasedCategories: () => loadPurchasedCategories(scopeContext),
  loadContractProductLookup: () => loadContractProductLookup(scopeContext),
  ...scopedServices(scopeActor, scopeContext)
});

export default createContractProductsServices;
