import type {
  IBasketProduct,
  IBasketPromotion,
} from "@upmind-automation/types";
import type { ProductModel, SubproductModel, Product } from "../product";
// -----------------------------------------------------------------------------

export interface BasketHelperContext<T = unknown> {
  [key: string]: any;
  // Converts a basket product to an unknown Typem eg: From BasketProduct to DomainProduct
  parseBasketProduct: (product: IBasketProduct) => T | undefined;
  //  Converts an unknown model into the correct product model to be added to the basket
  parseProductModel: (model: T) => ProductModel | undefined;

  promotions?: IBasketPromotion[];
}

export interface BasketProduct extends ProductModel {
  id: string;
  serviceIdentifier?: string;
  product: Product;
  // ---
  summary: {
    details: (BasketProductSummaryDetail | BasketProductSummaryPrice)[];
    pricing: BasketProductSummaryPrice[];
  };
  // ---
  error?: {
    term?: any;
    attributes?: any;
    options?: any;
    provisionFields?: any;
  };
}

export interface BasketProductSummaryMeta {
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
}

export interface BasketProductSummaryDetail {
  name?: string;
  category?: string;
  title: string;
  cycle?: number;
  quantity?: number;
  meta?: BasketProductSummaryMeta;
}

/**
 * The price details for any price that is displayed in the UI
 * @interface PriceDetail
 * @property {number} currentAmount - The numerical price, after discounts have been applied
 * @property {string} currentPrice - The formatted price, after discounts have been applied
 * @property {number} regularAmount - The regular numerical price, before discounts have been applied
 * @property {string} regularPrice - The regular formatted price, before discounts have been applied
 * @property {number} savingAmount - The numerical saving price, the difference between the regular and current price which is the discount
 * @property {string} savingPrice - The formatted saving price, the difference between the regular and current price which is the discount
 * @property {string} savingPercent - The saving percentage, the difference between the regular and current price which is the discount
 */
interface PriceDetail {
  currentAmount: number;
  currentPrice: string;
  // ---
  regularAmount: number;
  regularPrice: string;
  // ---
  savingAmount: number;
  savingPrice: string;
  savingPercent: string;
}

/**
 * The price structure for any price that is displayed in the UI
 * We will always provide the price details:
 *    Based on the TOTAL CONFIGURATION which could be GROSS OR NET based on the Brands settings
 *    This would include quantity modifier, discounts, and any other adjustments
 *    Effectively this is the price that should be shown to the customer
 * We also provide all the necessary breakdowns for display and tracking purposes
 * The Individual unit price, both gross and net:
 *    Individual unit prices are the base price of the product, before any adjustments or quantity modifiers
 * The Configuration price, both gross and net:
 *    Configuration prices are the total price of the product, including any adjustments or quantity modifiers
 */
export interface Price extends PriceDetail {
  unit?: {
    gross: PriceDetail;
    net: PriceDetail;
  };
  configuration?: {
    gross: PriceDetail;
    net: PriceDetail;
  };
}

export interface BasketProductSummaryPrice
  extends BasketProductSummaryDetail,
    Price {}

export interface IBasketProductModel {
  product_id: string;
  quantity: number;
  billing_cycle_months: number;
}

export interface IBasketSubProductModel {
  product_id: string;
  unit_quantity: number;
  billing_cycle_months: number;
}

export interface IBasketProductData extends IBasketProductModel {
  product_id: string;
  quantity: number;
  billing_cycle_months: number;
  // ---
  attributes?: IBasketSubProductModel[];
  options?: IBasketSubProductModel[];
  provision_field_values?: Record<string, any>;
  promotions?: { promocode: string }[];
}
