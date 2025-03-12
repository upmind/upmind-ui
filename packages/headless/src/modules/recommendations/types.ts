// --- types
import type { ActorRef } from "xstate";
import type {
  IRelatedObject,
  IProduct,
  IBasketProduct,
} from "@upmind-automation/types";
import type { BasketProduct } from "../basket/types";
import type { ProductModel } from "../product/types";

// ---
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

// ---

export interface Recommendation {
  id: string;
  productId: string;
  // ---
  name?: any;
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
  config?: {
    productId: string;
    quantity?: number;
    term?: number;
    subproducts?: string[];
    provisionFields?: {
      [key: string]: string | number;
    };
    coupons?: string[];
  };
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
// ---  Contexts

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
  currencyId?: string;
  promotions?: string[];
  basketId?: string;
  basketHelper?: ActorRef<any>;
  itemBuilder?: (item: ProductModel) => ProductModel;
  basketItemMapper?: (item: BasketProduct) => Partial<ProductModel>;
  basketItemBuilder?: (model: ProductModel) => BasketProduct;
  // ---
}

export interface RelatedProduct extends IRelatedObject {
  // --- additional fields
  image_url?: string;
  short_description?: string;
  // --- augmented fields
  product?: IProduct;
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
