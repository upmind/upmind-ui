// --- internal
import { parseProduct, parseTerms } from "../product/utils";

// --- utils
import { get, reduce, concat, sortBy, find, reject } from "lodash-es";
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
export function parseRelatedProducts(raw: IBasket): RelatedProduct[] {
  const products: IBasketProduct[] = get(
    raw,
    "products",
    []
  ) as IBasketProduct[];

  return reduce(
    products,
    (result: RelatedProduct[], item: IBasketProduct) => {
      // safe check : dont include recommendations for products that are not single products

      if (item?.product?.product_type !== ProductTypes.SINGLE_PRODUCT)
        return result;
      const related = reject(
        item?.product?.related,
        (related: RelatedProduct) =>
          !related.active || related.object_type !== "product"
      );
      return concat(result, related); //uniqBy(result, "object_id");
    },
    []
  );
}

export function parseRecommendation(raw: RelatedProduct): Recommendation {
  const product = parseProduct(raw.product);
  const terms = parseTerms(raw?.product?.prices);
  const term = find(terms, { cycle: product.cycle });
  return {
    ...product,
    ...term,
    // --- forced overrides
    id: raw?.product_id, // this is the productId that forms the basis of the recommendation, is the sou
    productId: product.id, // this is the productId that is recommended
    label: useTranslateField(raw, "label"),
    name: useTranslateName(raw) || product.name,
    description: useTranslateField(raw, "description") || product.description,
    excerpt: useTranslateField(raw, "short_description") || product.excerpt,
    imgUrl: raw?.image_url || product.imgUrl,
  };
}
