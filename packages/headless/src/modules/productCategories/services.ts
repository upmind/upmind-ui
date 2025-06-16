// --- internal
import { QueryParams, useQuery } from "../..";

// --- utils
import { isNil, map } from "lodash-es";
import { parseProductCategory } from "./mappers";
import { CacheIsStaleError, useTime } from "../../utils";

// --- types
import { ProductCategory } from "./types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IProductCategory } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "categories"];

function loadList(params?: Partial<QueryParams>) {
  const { list, useUrl } = useQuery();

  return list<IProductCategory[], ProductCategory[]>({
    ...(params as any),
    queryKey,
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
    }),
    limit: 0,
    withAccessToken: true,
    // --- options
    staleTime: useTime().HOUR,
    select: data => map(data ?? [], parseProductCategory),
  });
}

function loadCached() {
  const { queryClient } = useQuery();
  const cached = queryClient.getQueryData<ProductCategory[]>(queryKey);
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
