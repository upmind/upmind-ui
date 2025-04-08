// --- types
import type { ActorRef } from "xstate";

import type {
  IBasketProduct,
  IProduct,
  IClient,
  ICurrency,
  IBasketPromotion,
} from "@upmind-automation/types";
export { PromotionDisplayTypes } from "@upmind-automation/types";
import { PromotionDisplayTypes } from "@upmind-automation/types";
import type { Recommendation } from "../recommendations/types";
import type {
  BasketProduct,
  BasketProductSummaryDetail,
  BasketProductSummaryPrice,
  Price,
  BasketProductSummaryMeta,
} from "../basketProduct";

// -----------------------------------------------------------------------------

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
  title?: string; // computed name of the product
  // description?: string; // computed description of the product
  // ---
  lookups?: {
    product?: Product;
    terms?: Term[];
    options?: SubproductOption[];
    attributes?: SubproductOption[];
    provisionFields?: Record<string, any>;
  };
  // ---
  summary?: SummaryDetails; // IProductSummary;
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
  parseBasketProduct?: (item: ProductModel) => ProductModel;
  parseBasketProductComparison?: (item: BasketProduct) => Partial<ProductModel>;
}

export type Product = {
  id: string;
  title: string;
  brand: string;
  categoryId: string;
  category: string;
  categories?: string[]; // parent category names
  cycle: number;
  description?: string;
  excerpt?: string;
  imgUrl?: string;
  quantifiable: boolean;
  quantity: number;
  step: number;
  min: number;
  max: number; // or infinity
  defaultPaymentPeriod?: number;
  uiMeta?: Record<string, any>;
  uiCategoryMeta?: Record<string, any>;
};

export type ProductSummaryDetail = BasketProductSummaryDetail & {
  promotions?: Promotion[];
};

export type ProductSummaryPrice = ProductSummaryDetail &
  Price & {
    monthlyFromCurrentAmount?: number;
    monthlyFromCurrentPrice?: string;
    monthlyFromRegularAmount?: number;
    monthlyFromRegularPrice?: string;
  };

export type Term = ProductSummaryPrice & {};

export type SubproductOption = {
  id: string;
  title: string;
  name?: string;
  category?: string;
  description?: string;
  excerpt?: string;
  multiple: boolean;
  required: boolean;
  priceOverride: boolean;
  uiMeta?: Record<string, any>;
  uiCategoryMeta?: Record<string, any>;
  values?: SubProductOptionValue[];
};

export type SubProductOptionValue = Product & {
  id: string;
  order: number;
  default: boolean;
  // ---
  meta: BasketProductSummaryMeta;
  // ---
  price?: ProductSummaryPrice;
  prices?: ProductSummaryPrice[];
};

export type SummaryDetails = {
  isCalculating?: boolean;
  details?: ProductSummaryDetail[];
  pricing?: ProductSummaryPrice[];
};

export type Promotion = {
  title?: string;
  description?: string;
  excerpt?: string;
  savingAmount: number;
  savingPrice: string;
  savingPercent: string;
  code: string | string[];
  meta?: {
    display?: PromotionDisplayTypes;
    mixed?: boolean;
    discounted?: boolean;
  };
};

export type SubproductModel = Record<
  string, // Category ID
  Record<
    string, // Value ID
    {
      productId: string;
      cycle: number;
      quantity: number;
    }
  >
>;
export interface ProductModel {
  id?: string;
  productId: string;
  quantity: number;
  // ---
  subproducts?: string[];
  term?: number;
  attributes?: SubproductModel;
  options?: SubproductModel;
  provisionFields?: Record<string, any>;
  // ---
  currencyId?: string;
  promotions?: IBasketPromotion[];
  coupons?: string[]; // these are 'promotions' passed via url or config that are not in the basket yet
  // ---
  prices?: {
    term: { regular: number; current: number };
    attributes: { regular: number; current: number };
    options: { regular: number; current: number };
  };
}

export interface ProductPromotion {
  code: string;
}

export interface UIMeta {
  ui?: UIConfig;
  uischema?: UISchema;
  related?: Recommendation[];
}

export interface UIConfig {
  summary?: {
    append?: string;
  };
}

export interface UISchema {
  billing?: {
    control?: string;
  };
}
