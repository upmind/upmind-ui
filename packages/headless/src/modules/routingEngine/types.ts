// --- types
import type { ActorRef } from "xstate";
import type { IRelatedObject, IProduct } from "@upmind-automation/types";
import type { BasketProduct } from "../basket/types";
import type { ProductModel } from "../product/types";

// --------------------------------------------------------
//

export interface Flow {
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
  promotions?: string[];
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
// --------------------------------------------------------
// Contexts

export interface RoutingEngineContext {
  flow: Flow;
  // ---
  error?: any;
  // ---
  basketId?: string;
  // ---
}

// --------------------------------------------------------
// Events
