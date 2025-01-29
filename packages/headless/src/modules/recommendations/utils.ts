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
  isEmpty,
  set,
  toSafeInteger,
  uniqWith,
  includes,
  first,
  isString,
  map,
} from "lodash-es";
import { useTranslateField, useTranslateName } from "../../utils";

// --- types
import { ProductTypes } from "@upmind-automation/types";
import type { IBasket, IBasketProduct } from "@upmind-automation/types";
import type { BasketProduct } from "../basket";
import type {
  Recommendation,
  RelatedProduct,
  IProductConfig,
  Badge,
  Benefit,
} from "./types";
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
    (
      related: RelatedProduct[],
      basketProduct: IBasketProduct
    ): RelatedProduct[] => {
      // safe check : dont include recommendations for products that are not single products
      if (basketProduct?.product?.product_type !== ProductTypes.SINGLE_PRODUCT)
        return related;

      // Lets allow the back end to hide the native related products.
      // Any meta level (product, category) can have the hide_native_related flag
      const hideNative = true;
      // const hideNative = some(
      //   concat(
      //     basketProduct?.product?.meta,
      //     basketProduct?.product?.category?.meta
      //   ),
      //   "hide_native_related"
      // );

      // NB: we may get exact duplicates, as we may have several products that have the same related products and exact same configuration
      // so we need to filter out the duplicates

      const allRelated = reduce(
        concat(
          related,
          basketProduct?.product?.meta?.related,
          basketProduct?.product?.category?.meta?.related,
          hideNative ? [] : basketProduct?.product?.related
        ),
        (result: RelatedProduct[], rawRelated) => {
          const valid =
            rawRelated?.object_type === "product" && rawRelated?.active;

          if (valid) {
            rawRelated.id = ensureId(rawRelated);
            result.push(rawRelated);
          }

          return result;
        },
        []
      ) as RelatedProduct[];

      return uniqWith(allRelated, isEqual);
    },
    []
  );
}

export function parseRelationships(raw: IBasket): Record<string, string[]> {
  return reduce(
    raw.products,
    (relationships: Record<string, string[]>, product) => {
      // ---safe check : dont include recommendations for products that are not single products
      if (product.product?.product_type !== ProductTypes.SINGLE_PRODUCT)
        return relationships;

      const relatedProducts = concat(
        product.product?.related,
        product.product?.meta?.related,
        product.product?.category?.meta?.related
      );

      return reduce(
        relatedProducts,
        (acc, rawRelated) => {
          if (rawRelated?.object_type === "product" && rawRelated?.active) {
            rawRelated.id = ensureId(rawRelated);
            acc[rawRelated.id] ??= []; // safe check
            if (!includes(acc[rawRelated.id], product.id))
              acc[rawRelated.id].push(product.id);
          }
          return acc;
        },
        relationships
      );
    },
    {}
  );
}

export function parseAddedProducts(
  related: RelatedProduct[],
  products: IBasketProduct[]
): string[] {
  return reduce(
    related,
    (result: string[], item: RelatedProduct) => {
      // We considdr a product to be in the basket if it matches
      // the product_id
      // the billing_cycle_months (if specified)
      // the sub_pids (if specified
      const inBasket = some(products, product => {
        const productMatches =
          product.product_id == item.object_id && item.object_type == "product";

        const bcmMatches =
          !item?.config?.bcm || item.config.bcm == product.billing_cycle_months;

        const subproductsMatch =
          isEmpty(item?.config?.sub_pids) ||
          some(product.options, option => {
            return includes(item.config?.sub_pids, option.product_id);
          }) ||
          some(product.attributes, attribute => {
            return includes(item.config?.sub_pids, attribute.product_id);
          });

        return productMatches && bcmMatches && subproductsMatch;
      });

      if (inBasket) result.push(item.id);
      return result;
    },
    []
  );
}
/*
  Ensure we have a consistent id for the recommendation based on its configuration
  If the recommendation has an id, we use it, otherwise we generate a new one based on the product id and the config

  @param {RelatedProduct} raw - The raw recommendation data.
  @returns {string} The id of the recommendation.

*/
function ensureId(raw: RelatedProduct) {
  return get(raw, "id", sha1({ productId: raw.object_id, ...raw.config }));
}

// ---------------------------------------------------------------------------

export function parseRecommendation(
  raw: RelatedProduct,
  meta?: {
    added?: boolean;
    seen?: boolean;
    processing?: boolean;
    loading?: boolean;
  }
): Recommendation {
  const product = parseProduct(raw.product);
  const config: IProductConfig = get(raw, "config", {});
  const terms = parseTerms(raw?.product?.prices);
  const term =
    find(terms, { cycle: config?.bcm }) ??
    find(terms, { cycle: product?.cycle }) ??
    first(terms);

  const metaInfo = get(term, "meta", {});
  // --- additional state
  set(metaInfo, "added", meta?.added ?? false);
  set(metaInfo, "seen", meta?.seen ?? false);
  set(metaInfo, "processing", meta?.processing ?? false);
  set(metaInfo, "loading", meta?.loading ?? false);
  // ---
  return {
    productId: raw.object_id,
    ...product,
    ...term,
    meta: metaInfo,
    // --- forced overrides
    id: raw.id, // this is the  internal id of the recommendation, with a fallback to a random uuid for the meta generated recommendations, they dont have an id
    label: useTranslateField(raw, "label"),
    name: useTranslateName(raw) || product?.name,
    description: useTranslateField(raw, "description") || product?.description,
    excerpt: useTranslateField(raw, "short_description") || product?.excerpt,
    imgUrl: raw.image_url || product?.imgUrl,
    badge: isString(raw?.badge) ? ({ label: raw?.badge } as Badge) : raw?.badge,
    benefits: map(raw?.benefits, benefit => {
      if (isString(benefit)) return { label: benefit } as Benefit;
      return benefit;
    }),
    // --- default config to be used when adding to basket
    config: {
      productId: raw.object_id,
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
