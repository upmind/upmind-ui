// --- internal
import { parseProduct, parseTerms } from "../product/utils";

// --- utils
import { v4 as uuid } from "uuid";
import {
  compact,
  concat,
  find,
  get,
  isEqual,
  reduce,
  reject,
  set,
  toSafeInteger,
  uniqWith,
} from "lodash-es";
import { useTranslateField, useTranslateName } from "../../utils";

// --- types
import { ProductTypes } from "@upmind-automation/types";
import type { IBasket, IBasketProduct } from "@upmind-automation/types";
import type { BasketProduct } from "../basket";
import type { Recommendation, RelatedProduct, IProductConfig } from "./types";
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

// ---------------------------------------------------------------------------
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
    (result: RelatedProduct[], item: IBasketProduct): RelatedProduct[] => {
      // safe check : dont include recommendations for products that are not single products
      if (item?.product?.product_type !== ProductTypes.SINGLE_PRODUCT)
        return result;

      // NB: we may get exact duplicates, as we may have several products that have the same related products and exact same configuration
      // so we need to filter out the duplicates
      const allRelated = uniqWith(
        concat(
          result,
          item?.product?.related,
          item?.product?.meta?.related,
          item?.product?.category?.meta?.related
        ),
        isEqual
      );

      return reject(
        allRelated,
        (related: RelatedProduct) =>
          !related?.active || // exclude because were inactive
          related?.object_type !== "product" // exclude because were not a product
      ) as RelatedProduct[];
    },
    []
  );
}

// ---------------------------------------------------------------------------

export function parseRecommendation(
  raw: RelatedProduct,
  meta?: { added?: boolean; seen?: boolean }
): Recommendation {
  const product = parseProduct(raw.product);
  const terms = parseTerms(raw?.product?.prices);
  const term = find(terms, { cycle: product.cycle });
  const config: IProductConfig = get(raw, "config", {});
  // --- additional state
  set(term.meta, "added", meta?.added ?? false);
  set(term.meta, "seen", meta?.seen ?? false);
  // ---
  return {
    productId: product.id,
    ...product,
    ...term,
    // --- forced overrides
    id: raw?.id || uuid(), // this is the  internal id of the recommendation, with a fallback to a random uuid for the meta generated recommendations, they dont have an id
    label: useTranslateField(raw, "label"),
    name: useTranslateName(raw) || product.name,
    description: useTranslateField(raw, "description") || product.description,
    excerpt: useTranslateField(raw, "short_description") || product.excerpt,
    imgUrl: product.imgUrl,
    // --- default config to be used when adding to basket
    config: {
      productId: product.id,
      quantity: toSafeInteger(
        config?.qty || product?.min || product?.step || 1
      ),
      term: config?.bcm ?? term?.cycle ?? 0,
      subproducts: compact(config?.sub_pids?.toString()?.split(",") ?? []),
      provisionFields: config?.pfields ?? {},
      coupons: compact(config?.coupons?.toString()?.split(",") ?? []),
    },
  };
}
