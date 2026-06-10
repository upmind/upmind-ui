// --- internal
import { type QueryParams, useQuery, useSession } from "../..";
import { useBrand } from "../brand";

// --- utils
import { map } from "lodash-es";
import { useTime } from "../../utils";
import { parseProductCategory } from "./mappers";

// --- types
import { type ProductCategory } from "./types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IProductCategory } from "@upmind-automation/types";
import type { BrandMeta } from "../brand/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "categories"];

function loadList(params?: Partial<QueryParams>) {
  const { list, useUrl } = useQuery();
  const { uiCart } = useBrand();
  const { actorKey } = useSession();

  return list<IProductCategory[], ProductCategory[]>({
    ...(params as any),
    queryKey: [...queryKey, { actor: actorKey }],
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
    pagination: {
      limit: 0
    },
    withAccessToken: true,
    // --- options
    select: data =>
      map(data ?? [], category =>
        parseProductCategory(category, uiCart.value?.ui)
      ),
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
