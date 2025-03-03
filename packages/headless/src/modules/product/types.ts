// --- types
import type { ActorRef } from "xstate";

import type { BasketProduct } from "../basket/types";
import type {
  IBasketProduct,
  IProduct,
  IClient,
  ICurrency,
  IBasketPromotion,
} from "@upmind-automation/types";
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
  related?: IRelatedProduct[];
}

export interface IUIConfig {
  summary?: {
    append?: string;
  };
}

export interface IBenefit {
  icon: string | { icon: string };
  label: string;
}

export interface IBadge {
  label: string;
}

export interface IRelatedProduct {
  object_id: string;
  object_type: string;
  active: boolean;
  label: string;
  name: string;
  description: string;
  short_description?: string | null;
  image_url?: string | null;
  config: IRelatedProductConfig | any[];
  badge?: string | IBadge;
  benefits?: IBenefit[];
}

export interface IRelatedProductConfig {
  qty?: number;
  bcm?: number;
  sub_pids?: string[];
  pfields?: any[];
  coupons?: string[];
}

export interface IUISchema {
  billing?: {
    control?: string;
  };
}
