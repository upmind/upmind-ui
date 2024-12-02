// --- utils
import { get, reduce, map, isEmpty, sortBy } from "lodash-es";

// --- types
import type { BasketProduct } from "../basket";
import { ProductTypes } from "@upmind-automation/types";
import type {
  IBasket,
  IProduct,
  IRelatedObject,
} from "@upmind-automation/types";
import { useTranslateField, useTranslateName } from "@/utils";
import type { Recommendation } from "./types";
// ---------------------------------------------------------------------------
export function parseBasketItem(data: BasketProduct) {
  // TODO: implement
  // const name = data.product.serviceIdentifier;
  // const parsed = parseDomain(name);
  // const result = {
  //   productId: data.productId,
  //   tld: parsed?.tld,
  //   sld: parsed?.sld,
  //   domain: parsed?.domain,
  // };
  // return result;
}

/**
 * Parses the given basket and returns a list of recommendations.
 * The recommendations are extracted from the basket products, and only the single products are considered.
 * Inactive recommendations are not included.
 *
 * @param {IBasket} raw - The raw basket data to parse.
 * @returns {Recommendation[]} The parsed list of recommendations.
 */
export function parseRecommendations(raw: IBasket): Recommendation[] {
  const products: IProduct[] = get(raw, "products", []) as IProduct[];

  return reduce(
    products,
    (result: Recommendation[], item: IProduct) => {
      // safe check : dont include recommendations for products that are not single products
      if (item.product_type !== ProductTypes.SINGLE_PRODUCT) return result;

      const recommendations = reduce(
        sortBy(item.related, "order"),
        (resultRelated: Recommendation[], related: IRelatedObject) => {
          if (!related.active) return resultRelated;
          resultRelated.push({
            id: related.product_id, // this is the productId that forms the basis of the recommendation, is the sou
            productId: related.object_id, // this is the productId that is recommended
            name: useTranslateName(related),
            label: useTranslateField(related, "label"),
            description: useTranslateField(related, "description") || "",
          });

          return resultRelated;
        },
        []
      );

      if (!isEmpty(recommendations)) result.push(...recommendations);

      return result;
    },
    []
  );
}
