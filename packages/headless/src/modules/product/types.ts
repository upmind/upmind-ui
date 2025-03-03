// --- types
import type { ActorRef } from "xstate";

import type { BasketProduct } from "../basket/types";
import type {
  IBasketProduct,
  IProduct,
  IClient,
  ICurrency,
  IBasketPromotion,
  IProductCategory,
} from "@upmind-automation/types";
import type { Recommendation } from "../recommendations/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface ProductConfigContext {
  id: string;
  clientId?: IClient["id"];
  currencyId?: ICurrency["id"];
  promotions?: IBasketPromotion[];
  coupons?: string[]; // these are 'promotions' passed via url or config that are not in the basket yet
  baseModel?: ProductModel;
  model?: ProductModel;
  // ---
  rawProduct?: IProduct;
  lookups?: {
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
  meta?: UIMeta;
  // ---
  calculateCallback?: ActorRef<any>;
  error?: any;
  errorExternal?: any;
  // ---
  basketId?: string;
  basketProduct?: IBasketProduct;
  basketHelper?: ActorRef<any>;
  itemBuilder?: (item: ProductModel) => ProductModel;
  basketItemMapper?: (item: BasketProduct) => Partial<ProductModel>;
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

export interface UIMeta {
  ui?: IUIConfig;
  uischema?: IUISchema;
  related?: Recommendation[];
}

export interface IUIConfig {
  summary?: {
    append?: string;
  };
}

export interface IUISchema {
  billing?: {
    control?: string;
  };
}

export type { IProductCategory };
