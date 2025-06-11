// --- internal
import { QueryListParams, useQuery } from "../..";

// --- utils
import { isNil } from "lodash-es";
import { CacheIsStaleError } from "../../utils";

// --- types
import type { QueryKey } from "@tanstack/vue-query";
import type { IProductCategory } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "categories"];

function loadList(params?: QueryListParams) {
  const { get, useUrl } = useQuery();

  return get<IProductCategory[]>({
    queryKey: [...queryKey, params],
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
    withAccessToken: true,
    // --- options
  });
}

function loadCached() {
  const { queryClient } = useQuery();
  const cached = queryClient.getQueryData<IProductCategory[]>(queryKey);
  if (isNil(cached)) throw new CacheIsStaleError();
  return cached;
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadList,
  loadCached,
};
