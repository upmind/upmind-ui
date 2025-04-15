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
import type { BasketProduct } from "../basketProduct";

// -----------------------------------------------------------------------------
/**
 * The price details for any price , allowing for gross/net and discount breakdowns
 * @interface Price
 * @property {number} total - The total price of the product
 * @property {string} totalFormatted - The formatted total price of the product
 * @property {number} subtotal - The subtotal price of the product
 * @property {string} subtotalFormatted - The formatted subtotal price of the product
 * @property {number} discount - The discount price of the product
 * @property {string} discountFormatted - The formatted discount price of the product
 */
export interface Price {
  total: number;
  totalFormatted: string;
  subtotal: number;
  subtotalFormatted: string;
  discount: number;
  discountFormatted: string;
}

/**
 * The display price structure for any price that is displayed in the UI
 * We will always provide the price details:
 *    Based on the TOTAL CONFIGURATION which could be GROSS OR NET based on the Brands settings
 *    This would include quantity modifier, discounts, and any other adjustments
 *    Effectively this is the price that should be shown to the customer
 */
export type PriceDisplay = {
  currentAmount: number;
  currentPrice: string;
  // ---
  regularAmount: number;
  regularPrice: string;
  // ---
  savingAmount: number;
  savingPrice: string;
  savingPercent: string;
};

/**
 * The price details for any price that is displayed in the UI
 * We also provide all the necessary price breakdowns for display and tracking purposes
 * The Individual unit price, both gross and net:
 *    Individual unit prices are the base price of the product, before any adjustments or quantity modifiers
 * The Configuration price, both gross and net:
 *    Configuration prices are the total price of the product, including any adjustments or quantity modifiers
 */
export type PriceDetail = PriceDisplay & {
  unit?: Price;
  configuration?: Price;
};

// -----------------------------------------------------------------------------

/**
 * Represents a "configured" product with its configuration, pricing, and associated details.
 */
export type Product = {
  /**
   * The unique identifier of the product. Optional as pending products will not have an ID.
   */
  id?: string;

  /**
   * The model of the product, this contains the configuration settings/values to be used for editing purposes
   */
  configuration: ProductModel;

  /**
   * The detailed information about the actial product. This will contain all the product details such as title, description etc
   */
  productDetails: ProductDetails;

  /**
   * The promotions that are currently applied to the product.
   */
  promotions?: PromotionDetails[];

  meta: ProductSummaryMeta;

  /**
   * The display price details for the product. This is the total configured pricing including any discounts or adjustments.
   * It will always be the price that is shown to the customer, and it may or may not include tax, depending on the brand's settings.
   * The display price includes the current amount, regular amount, and any savings.
   */
  price: PriceDetail;

  /**
   * A breakdown of the product's pricing details.
   * This may have multiple entries depending on if some configuration options are not quantifiable
   */
  pricing: ProductSummaryDetailWithPrice[];

  /**
   * A summary of the product configuration.
   * This can include details with or without pricing information, depending on the context.
   * eg:
   *  terms will have pricing information
   *  a subproduct may have pricing information depending if its an option or attribute
   *  provision fields will not have pricing information
   */
  details: (ProductSummaryDetail | ProductSummaryDetailWithPrice)[];

  /**
   * An optional object containing errors related to the product.
   * This can include errors for terms, attributes, options, or provision fields.
   */
  errors?: {
    /**
     * Errors related to the product's term.
     */
    term?: any;

    /**
     * Errors related to the product's attributes.
     */
    attributes?: any;

    /**
     * Errors related to the product's options.
     */
    options?: any;

    /**
     * Errors related to the product's provision fields.
     */
    provisionFields?: any;
  };
};

/**
 * Represents the actual store product being configured.
 */
export type ProductDetails = {
  id: string;
  title: string;
  name: string; // untranslated name for reporting purposes
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

/**
 * Represents the product model used for configuration.
 * This is the model that is built and verified by the schema
 */
export type ProductModel = {
  id?: string;
  productId: string;
  quantity: number;
  // ---
  term?: number;
  attributes?: SubproductModel;
  options?: SubproductModel;
  provisionFields?: Record<string, any>;
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

export type PromotionModel = {
  code: string;
};

// The props required to create a product configuration
export interface ProductProps extends ProductModel {
  currencyId?: ICurrency["id"];
  clientId?: IClient["id"];
  promotions?: IBasketPromotion[];
  coupons?: string[]; // these are 'promotions' passed via url or config that are not in the basket yet
  subproducts?: string[]; // these are the ids of the subproducts that are passed via url or config that are not in the model/config yet
}

// syntax sugar for product summary
export type ProductSummary = {
  price: Product["price"];
  pricing: Product["pricing"];
  details: Product["details"];
};

export type ProductSummaryMeta = {
  oneoff?: boolean;
  quantifiable?: boolean;
  discounted?: boolean;
  free?: boolean;
  invalid?: boolean;
  overrides?: boolean;
  mixed?: boolean;
  includes?: boolean;
  available?: boolean;
  includesTax?: boolean;
  default?: boolean;
  freeTrail?: boolean;
};

export type ProductSummaryDetail = {
  name: string; // untranslated name for reporting purposes  category?: string;
  title: string;
  cycle?: number;
  category?: string;
  quantity?: number;
  promotions?: PromotionDetails[];
  meta: ProductSummaryMeta;
};

export type ProductSummaryDetailWithPrice = ProductSummaryDetail & {
  price: PriceDetail;
};

export type TermDetails = ProductSummaryDetail & {
  price: PriceDetail & {
    monthlyFromCurrentAmount?: number;
    monthlyFromCurrentPrice?: string;
    monthlyFromRegularAmount?: number;
    monthlyFromRegularPrice?: string;
  };
};

export type SubproductDetails = {
  id: string;
  name: string; // untranslated name for reporting purposes  category?: string;
  title: string;
  description?: string;
  excerpt?: string;
  uiMeta?: Record<string, any>;
  uiCategoryMeta?: Record<string, any>;
  // ---
  meta: {
    multiple: boolean;
    required: boolean;
    overrides: boolean;
  };
  // ---
  values?: SubproductValue[];
};

export type SubproductValue = ProductDetails & {
  meta: ProductSummaryMeta;
  price?: PriceDetail;
  promotions?: PromotionDetails[];
  pricing?: ProductSummaryDetailWithPrice[];
  order: number;
};

export type PromotionDetails = {
  name: string; // untranslated name for reporting purposes  category?: string;
  title: string;
  description?: string;
  excerpt?: string;
  code: string | string[];
  //  ---
  meta?: {
    display?: PromotionDisplayTypes;
    mixed?: boolean;
    discounted?: boolean;
  };
  price?: {
    savingAmount: PriceDetail["savingAmount"];
    savingPrice: PriceDetail["savingPrice"];
    savingPercent: PriceDetail["savingPercent"];
  };
};

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
// -----------------------------------------------------------------------------

export interface ProductConfigContext {
  id: string;
  clientId?: ProductProps["clientId"];
  currencyId?: ProductProps["currencyId"];
  promotions?: ProductProps["promotions"];
  coupons?: ProductProps["coupons"];
  subproducts?: ProductProps["subproducts"];
  // ---
  baseModel?: ProductModel;
  model?: ProductModel;
  // ---
  lookups?: {
    product?: ProductDetails;
    terms?: TermDetails[];
    options?: SubproductDetails[];
    attributes?: SubproductDetails[];
    provisionFields?: Record<string, any>;
    prices?: {
      calculating?: boolean;
      term?: number[];
      attributes?: number[];
      options?: number[];
    };
  };
  // ---
  product?: Product;
  meta?: UIMeta;
  // ---
  calculateCallback?: ActorRef<any>;
  error?: any;
  errorExternal?: any;
  // ---
  rawProduct?: IProduct;
  rawBasketProduct?: IBasketProduct;
  // ---
  basketId?: string;
  basketHelper?: ActorRef<any>;
  parseBasketProduct?: (item: ProductModel) => ProductModel;
  parseBasketProductComparison?: (item: BasketProduct) => Partial<ProductModel>;
}
