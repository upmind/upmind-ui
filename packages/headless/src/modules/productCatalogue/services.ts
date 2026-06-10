// --- external

// --- internal
import { useQuery, useSession } from "../..";
import { useBasketCurrency, useBasketPromotions } from "../basket";

// --- utils
import { map } from "lodash-es";
import { parseProduct } from "./mappers";
import { useTime } from "../../utils";

// --- types
import type { Product } from "../product";
import {
  ProvisionCategoryCodes,
  type IProduct
} from "@upmind-automation/types";
import type { QueryParams } from "../..";
import {
  keepPreviousData,
  type InfiniteData,
  type QueryKey
} from "@tanstack/vue-query";
import { parsePromotionsOrCoupons } from "../basketProduct/utils";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "catalogue"];

function loadList(params?: Partial<QueryParams>) {
  const { list, useUrl } = useQuery();
  const { currencyCode } = useBasketCurrency();
  const { promocodes } = useBasketPromotions();
  const { actorKey } = useSession();

  const query = list<IProduct[], Product[]>({
    ...(params as any),
    queryKey: [...queryKey, { promocodes, actor: actorKey }],
    url: useUrl(`basket/products`, {
      // NB: Always exclude domain names from the product catalogue as we use the Domain widget for the category
      "filter[provision_blueprint.category.code|neq]":
        ProvisionCategoryCodes.DOMAIN_NAMES,
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
    withAccessToken: true,
    withCurrency: true,
    withBasket: true,
    // --- options
    select: data => map(data ?? [], parseProduct),
    staleTime: useTime().HOUR,
    enabled: () => !!currencyCode.value,
    placeholderData: keepPreviousData
  });

  return query;
}

function loadInfinite(params?: Partial<QueryParams>) {
  const { listInfinite, useUrl } = useQuery();
  const { currencyCode } = useBasketCurrency();
  const { promocodes } = useBasketPromotions();
  const { actorKey } = useSession();

  return listInfinite<IProduct[], InfiniteData<Product[]>>({
    ...(params as any),
    queryKey: [...queryKey, { promocodes, actor: actorKey }],
    url: useUrl(`basket/products`, {
      // NB: Always exclude domain names from the product catalogue as we use the Domain widget for the category
      "filter[provision_blueprint.category.code|neq]":
        ProvisionCategoryCodes.DOMAIN_NAMES,
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
    withAccessToken: true,
    withCurrency: true,
    withBasket: true,
    // --- options
    select: data => map(data ?? [], parseProduct),
    staleTime: useTime().HOUR,
    enabled: () => !!currencyCode.value,
    placeholderData: keepPreviousData
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
