// --- internal
import { useQuery } from "../..";

// --- utils
import { isNil, map, flatMap } from "lodash-es";
import { parseProduct } from "./mappers";
import { CacheIsStaleError, useTime } from "../../utils";

// --- types
import type { Product } from "../product";
import type { QueryKey } from "@tanstack/vue-query";
import type { IProduct } from "@upmind-automation/types";
import type { QueryParams, RawInfiniteQueryData } from "../..";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "catalogue"];

function loadList(params?: Partial<QueryParams>) {
  const { list, useUrl } = useQuery();

  return list<IProduct[], Product[]>({
    ...(params as any),
    queryKey,
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
    withAccessToken: true,
    // --- options
    select: data => map(data ?? [], parseProduct),
    staleTime: useTime().HOUR,
  });
}

function loadInfinite(params?: Partial<QueryParams>) {
  const { listInfinite, useUrl } = useQuery();

  return listInfinite<RawInfiniteQueryData<IProduct[]>, Product[]>({
    ...(params as any),
    queryKey,
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
    withAccessToken: true,
    // --- options
    staleTime: useTime().HOUR,
    select: data => {
      // Flatten the array of pages into a single array of products
      const products = flatMap(data.pages, page => page.pageData ?? []);
      // Now map over the flattened array
      return map(products, parseProduct);
    },
  });
}

function loadCached() {
  const { queryClient } = useQuery();
  const cached = queryClient.getQueryData<Product[]>(queryKey);
  if (isNil(cached)) throw new CacheIsStaleError();
  return cached;
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadList,
  loadInfinite,
  loadCached,
};
