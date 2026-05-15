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
  concat,
  defaultsDeep,
  filter,
  find,
  flatMap,
  forEach,
  get,
  includes,
  isEmpty,
  isString,
  keys,
  map,
  some,
  startsWith,
  toSafeInteger
} from "lodash-es";
import { useTranslateField, useTranslateName, useImageUrl } from "../../utils";

// --- types
import { ProductTypes } from "@upmind-automation/types";
import type { IBasket, IBasketProduct } from "@upmind-automation/types";
import {
  type Recommendation,
  type RelatedProduct,
  type RecommendationVisibility
} from "./types";
import { UIContext, type Badge, type Benefit } from "../config/schema";
import { calculateBillingTerm } from "../product/utils";
import {
  type ProductDetails,
  type TermDetails,
  type IProductConfig
} from "../product";
import { normaliseSubPids } from "../product/utils";
import { useConfig } from "../config/useConfig";
import {
  evaluateRules,
  buildConditionState
} from "../config/config.conditions";
import type { ConditionalValue } from "../config/types";

// ---------------------------------------------------------------------------

function parseProductsToRecommend(
  basketProduct: IBasketProduct,
  basketProducts: IBasketProduct[],
  basket: IBasket
): RelatedProduct[] {
  // safe check : dont include recommendations for products that are not single products
  if (basketProduct?.product?.product_type !== ProductTypes.SINGLE_PRODUCT) {
    return [];
  }

  // Per-product: productsToRecommend and the native flag can be conditional
  // on product.* state, so the call must be scoped to each basket product.
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
  const allRecommendations = concat<Record<string, any>>(
    dataRecommendations,
    nativeRecommendations
  );

  const mapped = map(allRecommendations, recommendation => {
    const related = {
      ...recommendation,
      product_id: get(recommendation, "product_id", basketProduct.product_id)
    } as RelatedProduct;
    related.id = ensureId(related);
    return related;
  });

  // Filter at source so hidden recommendations don't leak into raw.related
  // (and therefore don't reach pushViewRecommendations or setSeen).
  // In-basket detection is no longer a filter — meta.added is populated
  // separately by the engine via isRecommendationInBasket.
  return filter(mapped, rec =>
    checkConditionVisibility(rec, basket, basketProducts)
  );
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
    return parseProductsToRecommend(basketProduct, products, raw);
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
  const products = get(raw, "products", []) as IBasketProduct[];

  forEach(products, product => {
    if (product.product.product_type !== ProductTypes.SINGLE_PRODUCT) return;

    forEach(parseProductsToRecommend(product, products, raw), related => {
      relationships[related.id] ??= [];
      if (!includes(relationships[related.id], product.id)) {
        relationships[related.id].push(product.id);
      }
    });
  });

  return relationships;
}

/**
 * Returns true if any rule references a basketProduct.* state key.
 * When false, conditions can be evaluated once against basket state.
 * When true, conditions must be evaluated per matching basket product.
 */
function hasBasketProductKeys(
  conditions: ConditionalValue<RecommendationVisibility>
): boolean {
  return some(conditions.rules, rule => {
    if (!rule.when) return false;
    return some(keys(rule.when), key => startsWith(key, "basketProduct."));
  });
}

/**
 * Evaluates conditional visibility rules for a recommendation.
 * Returns true if the recommendation should be visible based on basket state.
 *
 * Conditions referencing only basket.* keys evaluate once against basket state.
 * Conditions referencing basketProduct.* keys walk each basket product whose
 * product_id matches the recommendation; if any of those evaluations resolves
 * to "hidden", the recommendation is hidden.
 *
 * @param recommendation - The recommendation to evaluate
 * @param basket - The basket state for condition evaluation
 * @param basketProducts - Basket products for per-product evaluation
 * @returns true if visible, false if hidden
 */
export function checkConditionVisibility(
  recommendation: RelatedProduct,
  basket: IBasket,
  basketProducts: IBasketProduct[]
): boolean {
  if (!recommendation.conditions) return true;

  if (!hasBasketProductKeys(recommendation.conditions)) {
    const state = buildConditionState({ basket });
    return (
      evaluateRules<RecommendationVisibility>(
        recommendation.conditions,
        state
      ) === "visible"
    );
  }

  const matchingProducts = filter(
    basketProducts,
    bp => bp.product_id === recommendation.object_id
  );

  if (isEmpty(matchingProducts)) {
    const state = buildConditionState({ basket });
    return (
      evaluateRules<RecommendationVisibility>(
        recommendation.conditions,
        state
      ) === "visible"
    );
  }

  return !some(matchingProducts, basketProduct => {
    const state = buildConditionState({ basket, basketProduct });
    return (
      evaluateRules<RecommendationVisibility>(
        recommendation.conditions!,
        state
      ) === "hidden"
    );
  });
}

/**
 * Resolves whether a recommendation should be marked as already in the basket.
 * Drives `meta.added` on the parsed recommendation.
 *
 * Auto-scopes evaluation to basket products whose `product_id` matches the
 * recommendation's `object_id` — authors don't reference "self" in rules.
 *
 * - When `inBasketConditions` is omitted, falls back to a loose product_id
 *   match: true when any variant of the recommendation's product is in the
 *   basket.
 * - When present with no matching basket products, returns the rule's
 *   `default`.
 * - When present with matching basket products, evaluates per-match and
 *   OR-folds the results: returns true if any evaluation resolves to true,
 *   otherwise the rule's `default`. Author rules in the canonical form
 *   `{ default: false, rules: [{ then: true }] }`; see README for why.
 *
 * @param recommendation - The recommendation to evaluate
 * @param basketProducts - Basket products to check against
 * @param basket - Optional basket state (only needed if rules reference basket.* keys)
 * @returns true when the recommendation should be marked as in basket
 */
export function isRecommendationInBasket(
  recommendation: RelatedProduct,
  basketProducts: IBasketProduct[],
  basket?: IBasket
): boolean {
  if (recommendation.object_type !== "product") return false;

  const matchingProducts = filter(
    basketProducts,
    bp => bp.product_id === recommendation.object_id
  );

  // Default: loose product_id match.
  if (!recommendation.inBasketConditions) {
    return !isEmpty(matchingProducts);
  }

  // No matching basket products → fall back to default.
  if (isEmpty(matchingProducts)) {
    return recommendation.inBasketConditions.default;
  }

  // Evaluate per matching basket product. true if any resolve to true,
  // otherwise the default (carried by evaluateRules when no rule fires).
  return some(matchingProducts, basketProduct => {
    const state = buildConditionState({
      basket: basket ?? ({} as IBasket),
      basketProduct
    });
    return evaluateRules<boolean>(recommendation.inBasketConditions!, state);
  });
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
  const { data } = useConfig({
    context: UIContext.RECOMMENDATIONS,
    product: { productDetails }
  });

  term.meta = defaultsDeep(term.meta, {
    added: meta?.added ?? false,
    seen: meta?.seen ?? false,
    processing: meta?.processing ?? false,
    loading: meta?.loading ?? false,
    available: !data.productUnavailable,
    availableReason: data.productUnavailableReason
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
