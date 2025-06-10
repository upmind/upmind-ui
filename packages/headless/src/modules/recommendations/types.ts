// --- types
import type { ActorRef } from "xstate";
import type {
  IRelatedObject,
  IProduct,
  IBasketProduct,
  ICurrency,
  IPromotion,
} from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct";
import type {
  ProductModel,
  ProductProps,
  IProductConfig,
  Product,
} from "../product";
import { QueryResponseError } from "../query";

// -----------------------------------------------------------------------------

export interface Badge {
  label?: string;
  color?: string;
  variant?: string;
  size?: string;
  class?: string;
}

export interface Benefit {
  label: string;
  icon?: string | any;
}

interface Promotion {
  id: string;
  amount: number;
  amountFormatted: string;
}

export interface Recommendation extends Product {
  id: string;
  // ---
  serviceIdentifier?: string;
  productDetails: Product["productDetails"] & {
    label: string;
    badge?: Badge;
    benefits?: Benefit[];
  };

  // --- we need additional monthly price details for recommendations
  price: Product["price"] & {
    monthlyFromCurrentAmount?: number;
    monthlyFromCurrentPrice?: string;
    monthlyFromRegularAmount?: number;
    monthlyFromRegularPrice?: string;
  };
  /**
   * The product configuration matches the way we can interperet a product config machine: ie ProductProps
   * This has additional fields to allow setting sub_pids, coupons,currency, etc...
   */
  configuration: ProductProps;
  // ---
  meta: Product["meta"] & {
    seen?: boolean;
    added?: boolean;
    processing?: boolean;
    loading?: boolean;
  };
}

export interface RecommendationsEngineContext {
  recommendations: Recommendation[];
  raw: {
    products: IProduct[];
    related: RelatedProduct[];
    relationships: Record<string, string[]>;
    seen: string[];
    added: IBasketProduct[];
  };
  // ---
  error?: QueryResponseError;
  basketItem?: ActorRef<any>;
  // ---
  currency?: ICurrency;
  promotions?: IPromotion[];
  basketId?: string;
  basketHelper?: ActorRef<any>;
  parseBasketProduct?: (item: ProductModel) => ProductModel;
  parseBasketProductComparison?: (item: BasketProduct) => Partial<ProductModel>;
  parseProductModel?: (
    recommendation: Recommendation,
    products: IBasketProduct[]
  ) => ProductProps;
  // ---
}

export interface RelatedProduct extends IRelatedObject {
  // --- additional fields
  image_url?: string;
  short_description?: string;
  // --- augmented fields
  product: IProduct;
  // --- config to be used in adding the recommendation
  config?: IProductConfig;
  badge?: Badge;
  benefits?: Benefit[];
}
