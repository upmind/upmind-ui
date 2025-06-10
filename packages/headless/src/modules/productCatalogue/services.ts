// --- internal
import { useQuery } from "../..";

// --- utils
import { isNil, map } from "lodash-es";
import { parseProduct } from "./mappers";
import { CacheIsStaleError } from "../../utils";

// --- types
import type { Product } from "../product";
import type { QueryKey } from "@tanstack/vue-query";
import type { PaginatedParams } from "../..";
import { IProduct } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "catalogue"];

async function loadAll() {
  const { getAsync, useUrl } = useQuery();

  return getAsync<IProduct[], Product[]>({
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
    select: data => map(data ?? [], parseProduct),
    queryKey,
    withAccessToken: true,
  });
}

async function load(paginationParams: PaginatedParams) {
  const { getAsync, useUrl } = useQuery();

  return getAsync<IProduct[], Product[]>({
    url: useUrl(`basket/products`, {
      with: [
        "image",
        "prices",
        "products_attributes",
        "products_options",
        "products_options.prices",
        `category${".top_category".repeat(4)}`,
      ].join(),
      ...paginationParams,
    }),
    select: data => map(data ?? [], parseProduct),
    queryKey,
    withAccessToken: true,
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
  loadAll,
  load,
  refresh: loadAll,
  loadCached,
};
