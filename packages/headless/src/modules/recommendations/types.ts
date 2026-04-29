// --- types
import type { ActorRef } from "xstate";
import type {
  IRelatedObject,
  IProduct,
  IBasketProduct,
  ICurrency,
  IPromotion
} from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct";
import type {
  ProductModel,
  ProductProps,
  IProductConfig,
  Product
} from "../product";
import type { ResponseError } from "../../utils";
import type { Benefit } from "../product";
import type { Badge } from "../config/schema";
import type { ConditionalValue } from "../config/types";

/**
 * Visibility state for conditional recommendations.
 */
export type RecommendationVisibility = "visible" | "hidden";

export const RECOMMENDATION_MATCH_LEVEL = {
  PRODUCT_ID: "product_id",
  PRODUCT_CONFIG: "product_config"
} as const;
export type RecommendationMatchLevel =
  (typeof RECOMMENDATION_MATCH_LEVEL)[keyof typeof RECOMMENDATION_MATCH_LEVEL];

/**
 * Interface representing a promotion applied to a recommendation.
 * This is an internal interface primarily used within the {@link Recommendation} structure.
 */
interface Promotion {
  /**
   * The unique identifier of the promotion.
   */
  id: string;
  /**
   * The monetary amount of the promotion (e.g. the discount value).
   */
  amount: number;
  /**
   * The monetary amount of the promotion, formatted as a string (e.g., "£10.00").
   */
  amountFormatted: string;
}

/**
 * Interface representing a single product recommendation, extending a base `Product`
 * with additional details specific to recommendations, such as pricing, configuration,
 * and meta-information for tracking.
 */
export interface Recommendation extends Product {
  /**
   * The unique identifier of the recommendation. This typically corresponds to a product ID.
   */
  id: string;
  // ---
  /**
   * An optional identifier for the service associated with the recommendation.
   */
  serviceIdentifier?: string;
  /**
   * Detailed product information for the recommendation, including a display label,
   * an optional badge, and associated benefits.
   */
  productDetails: Product["productDetails"] & {
    /**
     * The primary display label for the recommended product.
     */
    label: string;
    /**
     * An optional badge to display alongside the recommendation.
     */
    badge?: Badge;
    /**
     * An array of benefits associated with the recommended product.
     */
    benefits?: Benefit[];
  };

  // --- we need additional monthly price details for recommendations
  /**
   * Pricing details for the recommendation, augmented with monthly pricing calculations
   * based on current and regular amounts.
   */
  price: Product["price"] & {
    /**
     * The calculated monthly amount from the current price.
     */
    monthlyFromCurrentAmount?: number;
    /**
     * The calculated monthly price from the current price, formatted as a string.
     */
    monthlyFromCurrentPrice?: string;
    /**
     * The calculated monthly amount from the regular price.
     */
    monthlyFromRegularAmount?: number;
    /**
     * The calculated monthly price from the regular price, formatted as a string.
     */
    monthlyFromRegularPrice?: string;
  };
  /**
   * The product configuration matching the structure expected by a product configuration machine ({@link ProductProps}).
   * This includes additional fields for setting subproducts (`sub_pids`), coupons, currency, etc.,
   * allowing the recommendation to be easily added to a basket with specific options.
   */
  configuration: ProductProps;
  // ---
  /**
   * Meta-information about the recommendation's state within the engine.
   */
  meta: Product["meta"] & {
    /**
     * `true` if the user has seen this recommendation.
     */
    seen?: boolean;
    /**
     * `true` if this recommendation has been added to the basket.
     */
    added?: boolean;
    /**
     * `true` if the recommendation is currently being processed (e.g. being added to the basket).
     */
    processing?: boolean;
    /**
     * `true` if the recommendation data is currently being loaded.
     */
    loading?: boolean;
  };
}

/**
 * Interface representing the context for the recommendation engine, typically managed by an XState machine.
 * It holds the list of recommendations, raw product data, relationships, and various helper functions
 * and references for basket integration.
 */
export interface RecommendationsEngineContext {
  /**
   * An array of active {@link Recommendation} objects displayed by the engine.
   */
  recommendations: Recommendation[];
  /**
   * Raw data used internally by the engine, including original products, related product mappings,
   * seen recommendations, and items added to the basket.
   */
  raw: {
    /**
     * An array of raw `IProduct` objects fetched from the API.
     */
    products: IProduct[];
    /**
     * An array of {@link RelatedProduct} objects, detailing relationships between products.
     */
    related: RelatedProduct[];
    /**
     * A record mapping product IDs to arrays of related product IDs, defining relationships.
     */
    relationships: Record<string, string[]>;
    /**
     * An array of recommendation IDs that have been marked as 'seen' by the user.
     */
    seen: string[];
    /**
     * An array of `IBasketProduct` objects that have been added to the basket from recommendations.
     */
    added: IBasketProduct[];
  };
  // ---
  /**
   * An error object if any issue occurred during recommendation processing.
   */
  error?: ResponseError;
  /**
   * The failed recommendation that was added to the basket.
   */
  failedProduct?: ProductProps;
  // ---
  /**
   * The current currency in which recommendations' prices are displayed.
   */
  currency?: ICurrency;
  /**
   * An array of `IPromotion` objects that might apply to recommendations.
   */
  promotions?: IPromotion[];
  /**
   * The unique identifier of the current shopping basket.
   */
  basketId?: string;
  /**
   * An `ActorRef` to the basket helper service, facilitating integration with the main basket.
   */
  basketHelper?: ActorRef<any>;
  /**
   * A function to parse a {@link ProductModel} into a {@link ProductModel} suitable for the basket.
   */
  parseBasketProduct?: (item: ProductModel) => ProductModel;
  /**
   * A function to parse a {@link BasketProduct} into a partial {@link ProductModel} for comparison purposes.
   */
  parseBasketProductComparison?: (item: BasketProduct) => Partial<ProductModel>;
  /**
   * A function to parse a {@link Recommendation} and an array of `IBasketProduct`s into {@link ProductProps}
   * suitable for product configuration.
   */
  parseProductModel?: (
    recommendation: Recommendation,
    products: IBasketProduct[]
  ) => ProductProps;
  // ---
}

/**
 * Interface representing a product that is related to another product, extending
 * `IRelatedObject` with additional display fields and augmented product data.
 * This is used to define and enrich connections between products for recommendations.
 */
export interface RelatedProduct extends IRelatedObject {
  // --- additional fields
  /**
   * The URL for an image associated with the related product.
   */
  image_url?: string;
  /**
   * A short description of the related product.
   */
  short_description?: string;
  // --- augmented fields
  /**
   * The full `IProduct` object for the related product.
   */
  product: IProduct;
  // --- config to be used in adding the recommendation
  /**
   * Optional product configuration (`IProductConfig`) that can be applied
   * when adding this related product as a recommendation.
   */
  config?: IProductConfig;
  /**
   * An optional badge to display with the related product.
   */
  badge?: Badge;
  /**
   * An array of benefits associated with the related product.
   */
  benefits?: Benefit[];
  /**
   * Strategy for matching the recommendation against basket products.
   * - `"product_id"` (default): hide when any variant of the product is in the basket.
   * - `"product_config"`: hide only when the basket has an exact `bcm` + `sub_pids` match.
   */
  matchLevel?: RecommendationMatchLevel;
  /**
   * Conditional visibility rules evaluated against basket state.
   */
  conditions?: ConditionalValue<RecommendationVisibility>;
}
