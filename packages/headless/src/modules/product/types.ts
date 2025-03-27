// --- types
import type { ActorRef } from "xstate";

import type {
  IBasketProduct,
  IProduct,
  IClient,
  ICurrency,
  IBasketPromotion,
} from "@upmind-automation/types";
import { PromotionDisplayTypes } from "@upmind-automation/types";
import type { Recommendation } from "../recommendations/types";
import type {
  BasketProduct,
  BasketProductSummaryPrice,
  BasketProductSummaryDetail,
  Price,
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
    product?: ProductDetails;
    terms?: TermDetails[];
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

export type ProductDetails = {
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

export type TermDetails = {
  cycle: number;
  mixedPromotions: boolean;
  // ---
  monthlyFromCurrentAmount: number;
  monthlyFromCurrentPrice: string;

  monthlyFromRegularAmount: number;
  monthlyFromRegularPrice: string;

  currentAmount: number;
  currentPrice: string;

  regularAmount: number;
  regularPrice: string;

  meta: Record<string, any>;
};

export type SubproductOption = {
  id: string;
  name: string;
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

export type SubProductOptionValue = {
  id: string;
  cycle: number;
  // ---
  name: string;
  description?: string;
  excerpt?: string;
  // ---
  quantifiable: boolean;
  step: number;
  min: number;
  max: number;
  // ---
  default: boolean;
  meta: Record<string, any>;
  uiMeta?: Record<string, any>;
  uiCategoryMeta?: Record<string, any>;
  order: number;
  // ---
  price?: SubproductOptionPrice;
  prices?: SubproductOptionPrice[];
};

export type SubproductOptionPrice = Price & {
  name: string;
  promotions: PromotionDetails[];
  mixedPromotions: boolean;
  cycle: number;
  meta: Record<string, any>;
};

export type SummaryDetails = {
  isCalculating?: boolean;
  details?: BasketProductSummaryDetail[];
  pricing?: BasketProductSummaryPrice[];
};

export type PromotionDetails = {
  amount: number;
  amountFormatted: string;
  code: string | string[];
  description?: string;
  display: PromotionDisplayTypes;
  excerpt?: string;
  mixed: boolean;
  name?: string;
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
