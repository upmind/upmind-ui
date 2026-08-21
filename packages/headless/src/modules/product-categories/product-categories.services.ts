/** @internal */
import { keepPreviousData, type QueryKey } from "@tanstack/vue-query";
import { useBasketCurrency } from "../basket";
import { useBrand } from "../brand";
import { useQuery } from "../query";
import { parseProductCategory } from "./product-categories.mappers";
import { useQuerySchema } from "./product-categories.schemas";
import { useTime } from "../../utils";
import { map } from "lodash-es";
import type {
  ProductCategory,
  ProductCategoryQueryModel
} from "./product-categories.types";
import type { IProductCategory } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["product", "categories"];

/**
 * The whole request state is the DECLARED query schema: `list()` constructs the
 * criteria from it and publishes it back on the handle, so there is no params
 * back door a caller could contradict it through.
 */
function loadList(model?: Partial<ProductCategoryQueryModel>) {
  const { list, useUrl } = useQuery();
  const { currencyCode } = useBasketCurrency();
  const { uiCart } = useBrand();

  return list<IProductCategory[], ProductCategory[], ProductCategoryQueryModel>(
    {
      criteria: { schema: useQuerySchema(), model },
      queryKey: [...queryKey, { currencyCode }],
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
      withAccessToken: true,
      // --- options
      select: data =>
        map(data ?? [], category =>
          parseProductCategory(category, uiCart.value?.ui)
        ),
      staleTime: useTime().HOUR,
      enabled: () => !!currencyCode.value,
      placeholderData: keepPreviousData
    }
  );
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadList
};
