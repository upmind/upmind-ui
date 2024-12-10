// --- types
import type { ActorRef } from "xstate";
import type { IRelatedObject, IProduct } from "@upmind-automation/types";
import type { BasketProduct } from "../basket/types";
import type { ProductModel } from "../product/types";
// --------------------------------------------------------
//

export interface Recommendation {
  id: string;
  productId: string;
  // ---
  name?: any;
  label?: any;
  description?: any;
  // ---
  config: {
    productId: string;
    quantity: number;
    term: number;
    subproducts?: string[];
    provisionFields?: {
      [key: string]: string | number;
    };
    coupons?: string[];
  };
}
// --------------------------------------------------------
// Contexts

export interface RecommendationsEngineContext {
  recommendations: Recommendation[];
  raw: {
    products: BasketProduct[];
    related: RelatedProduct[];
    seen: RelatedProduct[];
  };
  // ---
  error?: any;
  controller?: AbortController;
  // ---
  currencyId?: string;
  promotions?: string[];
  basketId?: string;
  basketHelper?: ActorRef<any>;
  itemBuilder?: (item: ProductModel) => ProductModel;
  basketItemMapper?: (item: BasketProduct) => Partial<BasketProduct>;
  basketItemBuilder?: (model: ProductModel) => BasketProduct;
}

export interface RelatedProduct extends IRelatedObject {
  // --- additional fields
  image_url?: string;
  short_description?: string;
  // --- augmented fields
  product?: IProduct;
  // --- config to be used in adding the recommendation
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
// --------------------------------------------------------
// Events

export interface RecommendationsEngineEvents {
  type: "CHECK" | "REFRESH";
  data?: any;
  error?: any;
}
