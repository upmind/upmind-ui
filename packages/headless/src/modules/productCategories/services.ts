// --- internal
import { useQuery } from "../..";

// --- utils
import { isNil } from "lodash-es";
import { CacheIsStaleError } from "../../utils";

// --- types
import type { QueryKey } from "@tanstack/query-core";
import type { QueryResponse } from "../..";
import type { IProductCategory } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "categories"];

async function loadAll({ allowStale = true } = {}) {
  const { get, useUrl } = useQuery();

  return get<IProductCategory[]>({
    url: useUrl(`basket/products_categories`, {
      with: [
        "subcategories.image",
        "subcategories.subcategories.image",
        "subcategories.subcategories.subcategories.image",
        "subcategories.subcategories.subcategories.subcategories.image",
      ].join(),
      with_count: [
        "products,subcategories.products",
        "subcategories.subcategories.products",
        "subcategories.subcategories.subcategories.products",
        "subcategories.subcategories.subcategories.subcategories.products",
      ].join(","),
      limit: 0,
    }),
    queryKey,
    //allowStale,
    withAccessToken: true,
    //revalidateIfStale: true,
    // select: (response) => set(response, "data", response?.data),
  }).then(({ data }) => data);
}

function loadAllFromCache() {
  const { queryClient } = useQuery();
  const cached =
    queryClient.getQueryData<QueryResponse<IProductCategory[]>>(queryKey);
  if (isNil(cached)) throw new CacheIsStaleError();
  return cached.data;
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadAll,
  refresh: async () => loadAll({ allowStale: false }),
  loadAllFromCache,
};
