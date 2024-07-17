// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface ProductConfigContext {
  currency_id: IProductPrice["currency_id"];
  promotions: IProductPromotion[];

  raw: Object;

  lookups: {
    product: IProduct;
    terms: array;
    options: array;
    attributes: array;
  };
  baseModel: IProductModel;
  model: IProductModel;
  // ---
  config: IProductConfig;
  summary: IProductSummary;
  prices: {
    term: { subtotal: number; total: number; discount: number };
    attributes: { subtotal: number; total: number; discount: number };
    options: { subtotal: number; total: number; discount: number };
  };
  // ---
  error?: RequestError;
}

export interface IProductModel {
  id?: string; // this is only when it exists in the basket
  // ---
  product_id: IProduct["id"];
  quantity: IProduct["unit_quantity"]; // Configuration quantity
  // ---
  term: IProductTerm;
  attributes: array;
  options: array;
  start_trial?: boolean;
  // ---
  currency_id: IProductPrice["currency_id"];
  promotions: IProductPromotion[];
  // ---
  prices: {
    term: { subtotal: number; total: number; discount: number };
    attributes: { subtotal: number; total: number; discount: number };
    options: { subtotal: number; total: number; discount: number };
  };
}

export interface IProductConfig {
  id?: string; // this is only when it exists in the basket
  // ---
  attributes: {
    product_id: IProductAttribute["id"];
  }[];
  billing_cycle_months: IProductPrice["billing_cycle_months"];
  options: {
    billing_cycle_months: IProductOption["billing_cycle_months"];
    order_type?: IProductOption["order_type"];
    product_id: IProductOption["id"];
    selling_price?: number;
    total?: number;
    unit_quantity: IProductOption["unit_quantity"];
    unit_total?: number;
  }[];
  product_id: IProduct["id"];
  promotions?: { promocode: string }[];
  currency_id: IProductPrice["currency_id"];
  quantity: IProduct["unit_quantity"]; // Configuration quantity
  start_trial?: boolean;
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
