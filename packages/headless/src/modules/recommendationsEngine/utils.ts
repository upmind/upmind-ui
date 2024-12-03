// --- internal
import { parseBasketProductModel } from "../product/utils";

// --- utils
import { get, reduce, uniqBy, isEmpty, sortBy } from "lodash-es";
import { useTranslateField, useTranslateName } from "../../utils";

// --- types
import { ProductTypes } from "@upmind-automation/types";
import type { IBasket, IBasketProduct } from "@upmind-automation/types";
import type { BasketProduct } from "../basket";
import type { Recommendation, RelatedProduct } from "./types";
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
  const products: IBasketProduct[] = get(
    raw,
    "products",
    []
  ) as IBasketProduct[];

  return reduce(
    products,
    (result: Recommendation[], item: IBasketProduct) => {
      // safe check : dont include recommendations for products that are not single products

      if (item?.product?.product_type !== ProductTypes.SINGLE_PRODUCT)
        return result;

      const recommendations = reduce(
        sortBy(item?.product?.related, "order"),
        (resultRelated: Recommendation[], related: RelatedProduct) => {
          if (!related.active) return resultRelated;

          const model = parseBasketProductModel(related);

          resultRelated.push({
            id: related.product_id, // this is the productId that forms the basis of the recommendation, is the sou
            productId: related.object_id, // this is the productId that is recommended
            name:
              useTranslateName(related) || useTranslateName(related.product),
            label: useTranslateField(related, "label"),
            description:
              useTranslateField(related, "description") ||
              useTranslateField(related.product, "description") ||
              "",
            model,
          });

          return resultRelated;
        },
        []
      );

      if (!isEmpty(recommendations)) result.push(...recommendations);

      return uniqBy(result, "productId");
    },
    []
  );
}
