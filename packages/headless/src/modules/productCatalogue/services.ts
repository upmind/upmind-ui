// --- internal
import { QueryParams, useQuery } from "../..";

// --- utils
import { isNil, map } from "lodash-es";
import { parseProduct } from "./mappers";
import { CacheIsStaleError, useTime } from "../../utils";

// --- types
import type { Product } from "../product";
import type { QueryKey } from "@tanstack/vue-query";
import type { IProduct } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "catalogue"];

function loadList(params?: QueryParams) {
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
    staleTime: useTime().HOUR,
    select: data => map(data ?? [], parseProduct),
  });
}

function loadInfinite(params?: QueryParams) {
  const { listInfinite, useUrl } = useQuery();

  return listInfinite<IProduct[], Product[]>({
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
    select: data => map(data ?? [], parseProduct),
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
