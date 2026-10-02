/** @internal */
import {
  keepPreviousData,
  useQuery as useVueQuery,
  type QueryKey
} from "@tanstack/vue-query";
import { computed, toValue } from "vue";
import {
  ProvisionCategoryCodes,
  type IProduct
} from "@upmind-automation/types";
import { useBasketCurrency, useBasketPromotions } from "../basket";
import {
  queryClient,
  toPaginationInfo,
  useQuery,
  useQueryCriteria
} from "../query";
import { parseProduct } from "./product-catalogue.mappers";
import { useQuerySchema } from "./product-catalogue.schemas";
import { scopeQueryKey } from "./product-catalogue.utils";
import { useTime } from "../../utils";
import { isNil, map, omitBy } from "lodash-es";
import type { Product } from "../product";
import type {
  ProductCatalogueScope,
  ProductCountQuery,
  ProductQueryModel
} from "./product-catalogue.types";
import type { RequestPagination } from "../query";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "catalogue"];

/** The stock `with` list of the catalogue reads. */
const WITH = [
  "image",
  "images",
  "prices",
  "products_attributes",
  "products_options",
  "products_options.prices",
  `category${".top_category".repeat(4)}`
].join(",");

/**
 * The URL of a catalogue read. The `filter[...|neq]` is a collection-scoping
 * constant, not request state — the catalogue never carries domain products.
 * A scope adds only its own sidecars, fixed for the query (ADR-032 S-D11).
 */
function catalogueUrl(scope?: ProductCatalogueScope) {
  const { useUrl } = useQuery();
  return useUrl(
    `basket/products`,
    omitBy(
      {
        // NB: Always exclude domain names from the product catalogue as we use the Domain widget for the category
        "filter[provision_blueprint.category.code|neq]":
          ProvisionCategoryCodes.DOMAIN_NAMES,
        with: WITH,
        account_id: scope?.accountId,
        currency_id: scope?.currencyId
      },
      isNil
    )
  );
}

/**
 * The whole request state is the DECLARED query schema: `list()` constructs the
 * criteria from it and publishes it back on the handle, so there is no params
 * back door a caller could contradict it through.
 */
function loadList(
  model?: Partial<ProductQueryModel>,
  scope?: ProductCatalogueScope
) {
  const { list } = useQuery();
  const { promocodes } = scope ? { promocodes: null } : useBasketPromotions();
  const { currencyCode } = scope ? { currencyCode: null } : useBasketCurrency();

  return list<IProduct[], Product[], ProductQueryModel>({
    criteria: { schema: useQuerySchema(scope), model },
    queryKey: scope
      ? scopeQueryKey(queryKey, scope)
      : [...queryKey, { promocodes, currencyCode }],
    url: catalogueUrl(scope),
    withAccessToken: true,
    withCurrency: !scope,
    withBasket: !scope,
    withoutBasket: !!scope,
    // --- options
    select: data => map(data ?? [], parseProduct),
    staleTime: useTime().HOUR,
    enabled: () =>
      scope ? (toValue(scope.enabled) ?? true) : !!currencyCode?.value,
    placeholderData: keepPreviousData
  });
}

/** The same collection, accumulated instead of paged — see {@link loadList}. */
function loadInfinite(
  model?: Partial<ProductQueryModel>,
  scope?: ProductCatalogueScope
) {
  const { listInfinite } = useQuery();
  const { promocodes } = scope ? { promocodes: null } : useBasketPromotions();
  const { currencyCode } = scope ? { currencyCode: null } : useBasketCurrency();

  return listInfinite<IProduct[], Product[], ProductQueryModel>({
    criteria: { schema: useQuerySchema(scope), model },
    queryKey: scope
      ? scopeQueryKey(queryKey, scope)
      : [...queryKey, { promocodes, currencyCode }],
    url: catalogueUrl(scope),
    withAccessToken: true,
    withCurrency: !scope,
    withBasket: !scope,
    withoutBasket: !!scope,
    // --- options
    select: data => map(data ?? [], parseProduct),
    staleTime: useTime().HOUR,
    enabled: () =>
      scope ? (toValue(scope.enabled) ?? true) : !!currencyCode?.value,
    placeholderData: keepPreviousData
  });
}

/**
 * The count of the matches of a scope. `list()` always passes the schema
 * `limit`, which is an integer, so it cannot ask for `limit=count`. This runs
 * ONE query whose function calls `request` with `limit: "count"`, sends the
 * translated `filters` and `sort` of the criteria, and reads the envelope
 * `total`. The handle carries the number on `pagination.total` and no rows.
 */
function loadCount(
  model: Partial<ProductQueryModel>,
  scope: ProductCatalogueScope
): ProductCountQuery {
  const { request } = useQuery();

  const criteria = useQueryCriteria<ProductQueryModel>({
    schema: useQuerySchema(scope),
    model
  });
  const filters = computed(() => criteria.props.value.filters);
  const sort = computed(() => criteria.props.value.sort);
  const url = catalogueUrl(scope);

  const response = useVueQuery<number>(
    {
      queryKey: [...scopeQueryKey(queryKey, scope), "count", { filters, sort }],
      queryFn: ({ signal }) =>
        request<IProduct[]>({
          url,
          filters: filters.value,
          sort: sort.value,
          pagination: { limit: "count" } as unknown as RequestPagination,
          withAccessToken: true,
          init: { signal }
        }).then(result => result.total ?? 0),
      staleTime: useTime().HOUR,
      enabled: () => toValue(scope.enabled) ?? true
    },
    queryClient
  );

  return {
    ...response,
    data: computed(() => null),
    pagination: computed(() =>
      toPaginationInfo(response.data.value ?? 0, 0, 1)
    ),
    meta: computed(() => ({
      hasNextPage: false,
      hasPrevPage: false,
      hasPages: false
    })),
    fetchNextPage: () => undefined,
    fetchPreviousPage: () => undefined,
    criteria: criteria.model,
    schema: criteria.schema,
    isFiltered: criteria.isFiltered,
    criteriaError: criteria.error,
    setCriteria: criteria.set
  } as unknown as ProductCountQuery;
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadList,
  loadInfinite,
  loadCount
};
