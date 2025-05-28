// --- internal
import { useQuery, useQueryPaginated } from "../..";

// --- utils
import { parseProductDetails } from "../product/utils";
import { isNil, set, map } from "lodash-es";
import { CacheIsStaleError } from "../../utils";

// --- types
import type { QueryKey } from "@tanstack/query-core";
import type { QueryResponse, PaginatedParams } from "../..";
import type { Product } from "../product/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "catalogue"];

async function loadAll({ allowStale = true } = {}) {
  const { get, useUrl } = useQuery();

  return get<Product[]>({
    url: useUrl(`basket/products`, {
      with: [
        "image",
        "prices",
        "products_attributes",
        "products_options",
        "products_options.prices",
        `category${".top_category".repeat(4)}`,
      ].join(),
      limit: 0,
    }),
    queryKey,
    allowStale,
    withAccessToken: true,
    revalidateIfStale: true,
    transformResponse: (response: any) =>
      set(response, "data", map(response?.data ?? [], parseProductDetails)),
  }).then(({ data }) => data);
}

async function loadPaged(
  paginationParams: PaginatedParams,
  { allowStale = true } = {}
) {
  const { get, useUrl } = useQueryPaginated();

  return get<Product[]>({
    url: useUrl(`basket/products`, {
      with: [
        "image",
        "prices",
        "products_attributes",
        "products_options",
        "products_options.prices",
        `category${".top_category".repeat(4)}`,
      ].join(),
    }),
    queryKey: [...queryKey, { ...paginationParams }],
    allowStale,
    withAccessToken: true,
    transformResponse: (response: any) =>
      set(response, "data", map(response?.data ?? [], parseProductDetails)),
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => data ?? []);
}

function loadAllFromCache() {
  const { queryClient } = useQuery();
  const cachedProductes =
    queryClient.getQueryData<QueryResponse<Product[]>>(queryKey);
  if (isNil(cachedProductes)) throw new CacheIsStaleError();
  return cachedProductes.data;
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadAll,
  loadPaged,
  refresh: async () => loadAll({ allowStale: false }),
  loadAllFromCache,
};
