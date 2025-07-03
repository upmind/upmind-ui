// --- internal
import { useQuery } from "../..";

// --- utils
import { map } from "lodash-es";
import { parseProduct } from "./mappers";
import { useTime } from "../../utils";

// --- types
import type { Product } from "../product";
import type { IProduct } from "@upmind-automation/types";
import type { QueryParams } from "../..";
import type { InfiniteData, QueryKey } from "@tanstack/vue-query";

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
        `category${".top_category".repeat(4)}`
      ].join(",")
    }),
    withAccessToken: true,
    // --- options
    select: data => map(data ?? [], parseProduct),
    staleTime: useTime().HOUR
  });
}

function loadInfinite(params?: Partial<QueryParams>) {
  const { listInfinite, useUrl } = useQuery();

  return listInfinite<IProduct[], InfiniteData<Product[]>>({
    ...(params as any),
    queryKey,
    url: useUrl(`basket/products`, {
      with: [
        "image",
        "prices",
        "products_attributes",
        "products_options",
        "products_options.prices",
        `category${".top_category".repeat(4)}`
      ].join(",")
    }),
    withAccessToken: true,
    // --- options
    select: data => map(data ?? [], parseProduct),
    staleTime: useTime().HOUR
  });
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadList,
  loadInfinite
};
