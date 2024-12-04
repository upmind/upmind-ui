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

  model?: any;
}
// --------------------------------------------------------
// Contexts

export interface RecommendationsEngineContext {
  model?: string[];
  recommendations: Recommendation[];
  raw: {
    products?: BasketProduct[];
    related: RelatedProduct[];
    categoryMeta?: RelatedProduct[];
    productMeta?: RelatedProduct[];
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
  itemMapper?: (item: BasketProduct) => Partial<BasketProduct>;
  basketItemMapper?: (item: BasketProduct) => Partial<BasketProduct>;
}

export interface RelatedProduct extends IRelatedObject {
  image_url?: string;
  short_description?: string;
  product?: IProduct;
}
// --------------------------------------------------------
// Events

export interface RecommendationsEngineEvents {
  type: "CHECK" | "REFRESH";
  data?: any;
  error?: any;
}
