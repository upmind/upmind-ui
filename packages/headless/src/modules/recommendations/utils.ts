// --- external
import { sha1 } from "object-hash";

// --- internal
import {
  parseProductDetails,
  parseQuantity,
  parseTermDetails
} from "../product/utils";

// --- utils
import {
  compact,
  defaultsDeep,
  filter,
  find,
  flatMap,
  forEach,
  get,
  includes,
  isEmpty,
  isString,
  map,
  reduce,
  some,
  toSafeInteger
} from "lodash-es";
import { useTranslateField, useTranslateName, useImageUrl } from "../../utils";

// --- types
import { ProductTypes } from "@upmind-automation/types";
import type { IBasket, IBasketProduct } from "@upmind-automation/types";
import type { Recommendation, RelatedProduct } from "./types";
import { UIContext, type Badge, type Benefit } from "../config/schema";
import { calculateBillingTerm } from "../product/utils";
import {
  type ProductDetails,
  type TermDetails,
  type IProductConfig
} from "../product";
import { normaliseSubPids } from "../product/utils";
import { useConfig } from "../config/useConfig";

// ---------------------------------------------------------------------------

function parseProductsToRecommend(
  basketProduct: IBasketProduct
): RelatedProduct[] {
  // safe check : dont include recommendations for products that are not single products
  if (basketProduct?.product?.product_type !== ProductTypes.SINGLE_PRODUCT) {
    return [];
  }

  const { ui, data } = useConfig({
    context: UIContext.RECOMMENDATIONS,
    product: {
      productDetails: parseProductDetails(basketProduct.product)
    }
  });

  // Config-based recommendations (always included if active)
  const dataRecommendations = filter(
    data.productsToRecommend ?? [],
    recommendation => recommendation.active
  );

  // Native recommendations (only if flag is visible)
  const nativeRecommendations = ui.productNativeRecommendations.isVisible
    ? filter(
        basketProduct?.product?.related ?? [],
        related => related.active && related.object_type === "product"
      )
    : [];

  // Combine and process all recommendations
  const allRecommendations = [...dataRecommendations, ...nativeRecommendations];

  return map(allRecommendations, recommendation => {
    const related = {
      ...recommendation,
      product_id: get(recommendation, "product_id", basketProduct.product_id)
    } as RelatedProduct;
    related.id = ensureId(related);
    return related;
  });
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
  const products = get(raw, "products", []) as IBasketProduct[];

  return flatMap(products, basketProduct => {
    if (basketProduct?.product?.product_type !== ProductTypes.SINGLE_PRODUCT) {
      return [];
    }
    return parseProductsToRecommend(basketProduct);
  });
}

/**
 *  This function parses the relationships between products in a basket.
 *  It extracts the related products from each product in the basket and creates a mapping of product IDs to their related product IDs.
 *  The relationships are stored in a dictionary where the keys are basket product IDs and the values are arrays of related product IDs.
 * @param raw - The raw basket data to parse.
 * @returns
 */
export function parseRelationships(raw: IBasket): Record<string, string[]> {
  const relationships: Record<string, string[]> = {};

  forEach(raw?.products, product => {
    if (product.product.product_type !== ProductTypes.SINGLE_PRODUCT) return;

    forEach(parseProductsToRecommend(product), related => {
      relationships[related.id] ??= [];
      if (!includes(relationships[related.id], product.id)) {
        relationships[related.id].push(product.id);
      }
    });
  });

  return relationships;
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

        const normalisedSubPids = normaliseSubPids(item?.config?.sub_pids);
        const subproductsMatch =
          isEmpty(normalisedSubPids) ||
          some(product.options, option => {
            return includes(normalisedSubPids, option.product_id);
          }) ||
          some(product.attributes, attribute => {
            return includes(normalisedSubPids, attribute.product_id);
          });

        return productMatches && bcmMatches && subproductsMatch;
      });

      if (inBasket) result.push(item.id);
      return result;
    },
    []
  );
}

export function checkInBasket(
  recommendation: RelatedProduct,
  products: IBasketProduct[]
): boolean {
  // We considdr a product to be in the basket if it matches
  // the product_id
  // the billing_cycle_months (if specified)
  // the sub_pids (if specified
  const inBasket = some(products, product => {
    const productMatches =
      product.product_id == recommendation.object_id &&
      recommendation.object_type == "product";

    const bcmMatches =
      !recommendation?.config?.bcm ||
      recommendation.config.bcm == product.billing_cycle_months;

    const normalisedSubPids = normaliseSubPids(
      recommendation?.config?.sub_pids
    );
    const subproductsMatch =
      isEmpty(normalisedSubPids) ||
      some(product.options, option => {
        return includes(normalisedSubPids, option.product_id);
      }) ||
      some(product.attributes, attribute => {
        return includes(normalisedSubPids, attribute.product_id);
      });

    return productMatches && bcmMatches && subproductsMatch;
  });

  return inBasket;
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

export function parseRecommendation(
  raw: RelatedProduct,
  meta?: {
    added?: boolean;
    seen?: boolean;
    processing?: boolean;
    loading?: boolean;
  }
): Recommendation {
  const productDetails: ProductDetails = !isEmpty(raw.product)
    ? parseProductDetails(raw.product)
    : ({} as ProductDetails);
  const config: IProductConfig = get(raw, "config", {});
  const terms = parseTermDetails(raw.product);
  // try use the provided config term, otherwise calculate the term based on the product details
  const term = !isEmpty(terms)
    ? find(terms, ["cycle", config?.bcm]) ||
      calculateBillingTerm(raw.product.default_payment_period, terms)
    : ({} as TermDetails);
  term.meta = defaultsDeep(term.meta, {
    added: meta?.added ?? false,
    seen: meta?.seen ?? false,
    processing: meta?.processing ?? false,
    loading: meta?.loading ?? false
  });

  // ---------------------------------------------------------------------------
  return {
    id: raw.id, // this is the  internal id of the recommendation
    productDetails: {
      ...productDetails,
      // --- forced overrides
      label: useTranslateField(raw, "label"),
      title: useTranslateName(raw) || productDetails?.title,
      description:
        useTranslateField(raw, "description") || productDetails?.description,
      excerpt:
        useTranslateField(raw, "short_description") || productDetails?.excerpt,
      images: raw.image_url
        ? [{ url: raw.image_url, alt: productDetails?.title }]
        : productDetails?.images,
      // --- additional ui data
      badge: isString(raw?.badge)
        ? ({ label: raw?.badge } as Badge)
        : raw?.badge,
      benefits: map(raw?.benefits, benefit =>
        isString(benefit) ? ({ label: benefit } as Benefit) : benefit
      )
    },
    meta: term?.meta,
    promotions: term?.promotions,
    price: term?.price,
    pricing: terms,
    details: [],
    // --- default config to be used when adding to basket
    configuration: {
      productId: raw.object_id,
      quantity: parseQuantity(
        toSafeInteger(
          config?.qty || productDetails?.min || productDetails?.step || 1
        ),
        productDetails
      ),

      term: config?.bcm ?? term?.cycle ?? 0,
      startTrial: productDetails?.trialSupported,
      subproducts: normaliseSubPids(config?.sub_pids),
      provisionFields: config?.pfields ?? {},
      coupons: compact(config?.coupons ?? [])
    }
  } as Recommendation;
}

// export function parseDataLayerItem(raw: RelatedProduct, index: number) {
//   const product = raw.product;
//   const config: IProductConfig = get(raw, "config", {});
//   const terms = raw?.product?.prices;
//   const term =
//     find(terms, { billing_cycle_months: config?.bcm }) ??
//     find(terms, { billing_cycle_months: product?.billing_cycle_months }) ??
//     first(terms);

//   //   currentAmount: rawTerm.price_discounted ?? rawTerm.price,
//   // currentPrice:
//   //   rawTerm.price_discounted_formatted ?? rawTerm.price_formatted,
//   // regularAmount: rawTerm.price,
//   // regularPrice: rawTerm.price_formatted,

//   return {
//     item_id: raw.object_id,
//     item_name: raw?.name || product?.name, // For reporting purposes we intentionally pass untranslated product name
//     discount: term?.price_discounted ? term?.price - term?.price_discounted : 0,
//     coupon: compact(config?.coupons?.toString()?.split(",") ?? []).toString(),
//     index,
//     item_brand: product?.brand?.name, // For reporting purposes we intentionally pass untranslated brand name
//     item_category: product?.category.name, // For reporting purposes we intentionally pass untranslated category name
//     // @ts-ignore: TODO see why this is warning when it is in fact valid
//     item_category2: product?.category?.top_category?.name, // For reporting purposes we intentionally pass untranslated category name
//     // @ts-ignore: TODO see why this is warning when it is in fact valid
//     item_category3: product?.category?.top_category?.top_category?.name, // For reporting purposes we intentionally pass untranslated category name
//     price: term?.price_discounted ?? term?.price,
//     // net_price: product?.configuration_net_amount_converted, //TODO: check the correct value is used
//     quantity: toSafeInteger(
//       config?.qty || product?.min_order_quantity || product?.unit_quantity || 1
//     ),
//     duration: config?.bcm ?? term?.billing_cycle_months ?? 0,
//   };
// }
