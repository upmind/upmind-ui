// --- external
import { sha1 } from "object-hash";

// --- internal
import { parseProduct, parseTerms } from "../product/utils";

// --- utils
import {
  compact,
  concat,
  find,
  get,
  isEqual,
  reduce,
  some,
  set,
  toSafeInteger,
  uniqWith,
  includes,
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
      const allRelated = reduce(
        concat(
          result,
          item?.product?.related,
          item?.product?.meta?.related,
          item?.product?.category?.meta?.related
        ),
        (resultB: RelatedProduct[], rawRelated) => {
          const valid =
            rawRelated?.object_type === "product" && rawRelated?.active;

          if (valid) {
            // ensure we have a consistent id for the recommendation based on its config
            if (!rawRelated?.id) {
              rawRelated.id = sha1({
                productId: rawRelated.object_id,
                ...rawRelated.config,
              });
            }

            // ---
            // this is the magic bit. We keep track of the product that we matched the recommendation to.
            // this will for the basis of any dynamic lookups as we know which products to look at
            rawRelated.relatonships ??= [];
            if (!includes(rawRelated.relatonships, item.id))
              rawRelated.relatonships.push(item.id);

            // ---
            resultB.push(rawRelated);
          }

          return resultB;
        },
        []
      ) as RelatedProduct[];

      return uniqWith(allRelated, isEqual);
    },
    []
  );
}

// ---------------------------------------------------------------------------

export function parseRecommendation(
  raw: RelatedProduct,
  meta?: { added?: boolean; seen?: boolean; processing?: boolean }
): Recommendation {
  const product = parseProduct(raw.product);
  const terms = parseTerms(raw?.product?.prices);
  const term = find(terms, { cycle: product.cycle });
  const config: IProductConfig = get(raw, "config", {});
  // --- additional state
  set(term.meta, "added", meta?.added ?? false);
  set(term.meta, "seen", meta?.seen ?? false);
  set(term.meta, "processing", meta?.processing ?? false);
  // ---
  return {
    productId: product.id,
    ...product,
    ...term,
    // --- forced overrides
    id: raw.id, // this is the  internal id of the recommendation, with a fallback to a random uuid for the meta generated recommendations, they dont have an id
    label: useTranslateField(raw, "label"),
    name: useTranslateName(raw) || product.name,
    description: useTranslateField(raw, "description") || product.description,
    excerpt: useTranslateField(raw, "short_description") || product.excerpt,
    imgUrl: raw.image_url || product.imgUrl,
    // ---
    relationships: raw.relationships,
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
