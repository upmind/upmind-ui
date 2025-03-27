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
import type { ProductModel } from "../product";

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

export interface Recommendation {
  id: string;
  productId: string;
  // ---
  title?: any;
  label?: any;
  description?: any;
  excerpt?: any;
  categoryId?: string;
  category?: string;
  serviceIdentifier?: string;
  imgUrl?: string;
  badge?: Badge;
  benefits?: Benefit[];
  // ---
  cycle?: number;
  quantity?: number;
  quantifiable?: boolean;
  step?: number;
  min?: number;
  max?: number;
  // ---
  defaultPaymentPeriod?: number;
  mixedPromotions?: boolean;
  monthlyFromCurrentAmount?: number;
  monthlyFromCurrentPrice?: string;
  monthlyFromRegularAmount?: number;
  monthlyFromRegularPrice?: string;
  currentAmount?: number;
  currentPrice?: string;
  regularAmount?: number;
  regularPrice?: string;
  // ---
  promotions?: Promotion[];
  // ---
  config?: ProductModel;
  meta?: {
    discounted?: boolean;
    free?: boolean;
    // overrides?: boolean;
    // invalid?: boolean;
    // includes?: boolean;
    // oneoff?: boolean;
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
  error?: any;
  basketItem?: ActorRef<any>;
  // ---
  currency?: ICurrency;
  promotions?: IPromotion[];
  basketId?: string;
  basketHelper?: ActorRef<any>;
  parseBasketProduct?: (item: ProductModel) => ProductModel;
  parseBasketProductComparison?: (item: BasketProduct) => Partial<ProductModel>;
  parseProductModel?: (model: ProductModel) => BasketProduct;
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

export interface IProductConfig {
  pid?: string;
  qty?: number;
  bcm?: number;
  sub_pids?: string[];
  pfields?: {
    [key: string]: string | number;
  };
  coupons?: string[];
}
