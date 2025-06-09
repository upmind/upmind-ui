// --- internal
import { useQuery } from "../..";

// --- utils
import { isNil } from "lodash-es";
import { CacheIsStaleError } from "../../utils";

// --- types
import type { QueryKey } from "@tanstack/query-core";
import type { IProductCategory } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "categories"];

async function loadAll() {
  const { getAsync, useUrl } = useQuery();

  return getAsync<IProductCategory[]>({
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
    withAccessToken: true,
  });
}

function loadAllFromCache() {
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
  loadAll,
  refresh: loadAll,
  loadAllFromCache,
};
