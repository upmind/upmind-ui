import type {
  IBasketProduct,
  IBasketPromotion,
} from "@upmind-automation/types";
import type { ProductModel, ProductDetails } from "../product";
// -----------------------------------------------------------------------------

export type SubProductChoices = Record<
  string, // the category id
  Record<
    string, // the subproduct id
    ProductDetails
  >
>;

export interface BasketHelperContext<T = unknown> {
  [key: string]: any;
  // Converts a basket product to an unknown Typem eg: From BasketProduct to DomainProduct
  parseBasketProduct: (product: IBasketProduct) => T | undefined;
  //  Converts an unknown model into the correct product model to be added to the basket
  parseProductModel: (model: T) => ProductModel | undefined;

  promotions?: IBasketPromotion[];
}

export interface BasketProduct {
  product_id?: any;
  id: string; // the basket product id (bpid)

  // --- Model
  productId: string;
  quantity: number;
  term: number;
  options?: SubProductChoices;
  attributes?: SubProductChoices;
  provisionFields?: Record<string, any>;
  serviceIdentifier?: string;

  // ---
  product: BasketProductDetails;

  // ---
  summary: {
    details: BasketProductSummaryDetail[];
    // ---
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

export type BasketProductDetails = Omit<
  ProductDetails,
  "cycle" | "quantity"
> & {};

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

export interface BasketProductSummaryDetail extends Price {
  key: string;
  category: string;
  title: string;
  cycle?: number;
  quantity?: number;
  meta?: BasketProductSummaryMeta;
}

export interface Price {
  currentAmount?: number;
  currentPrice?: string;
  // ---
  regularAmount?: number;
  regularPrice?: string;
  // ---
  currentSavingAmount?: number;
  currentSaving?: string;
}

export interface BasketProductSummaryPrice
  extends BasketProductSummaryDetail,
    Price {
  selling?: Price;
}

export interface BasketProductConfig {
  product_id?: string;
  quantity?: number;
  billing_cycle_months?: number;
  // ---
  attributes?: any[];
  options?: any[];
  provision_field_values?: any[];
  promotions?: any[]; //IProductPromotion[];
}
