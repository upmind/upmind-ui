// --- types
import type { ActorRef } from "xstate";

import type { RequestError } from "../api/types";
import type { Basket, BasketProduct } from "../basket";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts
export interface BasketProductConfig {
  product_id?: string;
  quantity?: number;
  billing_cycle_months?: number;
  // ---
  attributes?: any[];
  options?: any[];
  provision_field_values?: any[];
  promotions?: IProductPromotion[];
}

export interface ProductConfigContext {
  id: string;
  clientId: string; //IClient["id"];
  currencyId: string; //IProductPrice["currency_id"];
  promotions: IProductPromotion[];
  baseModel: ProductModel;
  model: ProductModel;
  // ---
  rawProduct?: IProduct;
  lookups: {
    product?: IProduct;
    terms?: any[];
    options?: any[];
    attributes?: any[];
  };
  // ---
  summary?: IProductSummary;
  prices?: {
    term: { subtotal: number; total: number; discount: number };
    attributes: { subtotal: number; total: number; discount: number };
    options: { subtotal: number; total: number; discount: number };
  };
  // ---
  calculateCallback?: ActorRef<any, any>;
  error?: RequestError;
  errorExternal: RequestError;
  // ---
  basketId?: string;
  basketProduct?: BasketProduct;
  basketHelper?: ActorRef<any>;
  itemBuilder?: (item: ProductModel) => ProductModel;
  itemMapper?: (item: BasketProduct) => Partial<BasketProduct>;
  basketItemBuilder?: (item: ProductModel) => BasketProductConfig;
  basketItemMapper?: (item: BasketProduct) => Partial<BasketProduct>;
  config: BasketProductConfig;
}

export interface ProductModel {
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
  promotions?: IProductPromotion[];
  // ---
  prices?: {
    term: { regular: number; current: number };
    attributes: { regular: number; current: number };
    options: { regular: number; current: number };
  };
}

export interface IProductPromotion {
  promocode: string;
}

export interface BasketContext {
  basket: Basket | null;
  items: Array;
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface ProductConfigEvent {
  type: "CHECK" | "REFRESH";
  data?: Basket;
  error?: RequestError;
}
