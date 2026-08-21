/** @internal */
import { keepPreviousData, type QueryKey } from "@tanstack/vue-query";
import {
  ProvisionCategoryCodes,
  type IProduct
} from "@upmind-automation/types";
import { useBasketCurrency, useBasketPromotions } from "../basket";
import { useQuery } from "../query";
import { parseProduct } from "./product-catalogue.mappers";
import { useQuerySchema } from "./product-catalogue.schemas";
import { useTime } from "../../utils";
import { map } from "lodash-es";
import type { Product } from "../product";
import type { ProductQueryModel } from "./product-catalogue.types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "catalogue"];

/**
 * The whole request state is the DECLARED query schema: `list()` constructs the
 * criteria from it and publishes it back on the handle, so there is no params
 * back door a caller could contradict it through. The URL's own
 * `filter[...|neq]` is a collection-scoping constant, not request state — the
 * catalogue never carries domain products.
 */
function loadList(model?: Partial<ProductQueryModel>) {
  const { list, useUrl } = useQuery();
  const { promocodes } = useBasketPromotions();
  const { currencyCode } = useBasketCurrency();

  const query = list<IProduct[], Product[], ProductQueryModel>({
    criteria: { schema: useQuerySchema(), model },
    queryKey: [...queryKey, { promocodes, currencyCode }],
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

/** The same collection, accumulated instead of paged — see {@link loadList}. */
function loadInfinite(model?: Partial<ProductQueryModel>) {
  const { listInfinite, useUrl } = useQuery();
  const { promocodes } = useBasketPromotions();
  const { currencyCode } = useBasketCurrency();

  return listInfinite<IProduct[], Product[], ProductQueryModel>({
    criteria: { schema: useQuerySchema(), model },
    queryKey: [...queryKey, { promocodes, currencyCode }],
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
