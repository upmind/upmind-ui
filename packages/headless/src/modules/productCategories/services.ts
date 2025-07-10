// --- internal
import { QueryParams, useQuery } from "../..";

// --- utils
import { map } from "lodash-es";
import { useTime } from "../../utils";
import { parseProductCategory } from "./mappers";

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
        "subcategories.subcategories.subcategories.subcategories.image"
      ].join(","),
      with_count: [
        "products",
        "subcategories.products",
        "subcategories.subcategories.products",
        "subcategories.subcategories.subcategories.products",
        "subcategories.subcategories.subcategories.subcategories.products"
      ].join(",")
    }),
    limit: 0,
    withAccessToken: true,
    // --- options
    select: data => map(data ?? [], parseProductCategory),
    staleTime: useTime().HOUR
  });
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadList
};
