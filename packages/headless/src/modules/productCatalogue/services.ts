// --- internal
import { useQuery } from "../..";
import { useBasket, useBasketPromotions } from "../basket";

// --- utils
import { map, set } from "lodash-es";
import { parseProduct } from "./mappers";
import { responseCodes, useTime } from "../../utils";

// --- types
import type { Product } from "../product";
import type { IProduct } from "@upmind-automation/types";
import type { QueryParams, QueryResponseError } from "../..";
import type { InfiniteData, QueryKey } from "@tanstack/vue-query";
import { parsePromotionsOrCoupons } from "../basketProduct/utils";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "catalogue"];

function loadList(params?: Partial<QueryParams>) {
  const { list, useUrl } = useQuery();
  const { basketId, isReady: isBasketReady } = useBasket();
  const { promotions } = useBasketPromotions();

  const urlParams = {
    promotions: parsePromotionsOrCoupons(promotions.value).join(),
    with: [
      "image",
      "images",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
      `category${".top_category".repeat(4)}`
    ].join(",")
  };

  if (basketId.value) set(urlParams, "basket_id", basketId.value);

  const query = list<IProduct[], Product[]>({
    ...(params as any),
    queryKey: [...queryKey, { basketId }],
    url: useUrl(`basket/products`, {
      ...urlParams
    }),
    withAccessToken: true,
    // --- options
    select: data => map(data ?? [], parseProduct),
    staleTime: useTime().HOUR
  });

  return query;
}

function loadInfinite(params?: Partial<QueryParams>) {
  const { listInfinite, useUrl } = useQuery();
  const { promotions } = useBasketPromotions();

  return listInfinite<IProduct[], InfiniteData<Product[]>>({
    ...(params as any),
    queryKey,
    url: useUrl(`basket/products`, {
      with: [
        "image",
        "images",
        "prices",
        "products_attributes",
        "products_options",
        "products_options.prices",
        `category${".top_category".repeat(4)}`
      ].join(",")
    }),
    promotions: parsePromotionsOrCoupons(promotions.value).join(),
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
