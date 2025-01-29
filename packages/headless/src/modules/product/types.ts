// --- types
import type { ActorRef } from "xstate";

import type { BasketProduct } from "../basket/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface ProductConfigContext {
  id: string;
  clientId: string; //IClient["id"];
  currencyId: string; //IProductPrice["currency_id"];
  promotions?: string[]; //IProductPromotion[];
  coupons?: string[]; // these are 'promotions' passed via url or config that are not in the basket yet
  baseModel: ProductModel;
  model: ProductModel;
  // ---
  rawProduct?: any;
  lookups: {
    product?: any;
    terms?: any[];
    options?: any[];
    attributes?: any[];
  };
  // ---
  summary?: any; // IProductSummary;
  prices?: {
    term?: number[];
    attributes?: number[];
    options?: number[];
  };
  // ---
  calculateCallback?: ActorRef<any, any>;
  error?: any;
  errorExternal: any;
  // ---
  basketId?: string;
  basketProduct?: BasketProduct;
  basketHelper?: ActorRef<any>;
  itemBuilder?: (item: ProductModel) => ProductModel;
  basketItemMapper?: (item: BasketProduct) => Partial<BasketProduct>;
}

export interface ProductModel {
  id?: string;
  productId: string;
  quantity: number;
  // ---
  subproducts?: string[];
  term?: number;
  attributes?: any;
  options?: any;
  provisionFields?: any;
  // ---
  currencyId?: string;
  promotions?: string[]; //IProductPromotion[];
  coupons?: string[]; // these are 'promotions' passed via url or config that are not in the basket yet
  // ---
  prices?: {
    term: { regular: number; current: number };
    attributes: { regular: number; current: number };
    options: { regular: number; current: number };
  };
}

export interface IProductPromotion {
  code: string;
}

// --------------------------------------------------------
// Events

export interface ProductConfigEvent {
  type: "CHECK" | "REFRESH";
  data?: any;
  error?: any;
}
