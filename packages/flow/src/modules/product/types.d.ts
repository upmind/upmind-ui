// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface ProductConfigContext {
  currency_id;
  promotions;
  // ---
  available: {
    product: IProduct;
    terms: array;
    options: array;
    attributes: array;
  };
  values: IProductValues;
  // ---
  config: IProductConfig;
  // ---
  error?: RequestError;
}

export interface IProductValues {
  id?: string; // this is only when it exists in the basket
  // ---
  product_id: IProduct["id"];
  quantity: IProduct["unit_quantity"]; // Configuration quantity
  // ---
  term: IProductTerm;
  attributes: array;
  options: array;
  promotions?: { promocode: string }[];
  start_trial?: boolean;
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

export interface BasketContext {
  basket: Basket | null;
  items: Array;
  error?: RequestError;
}

// --------------------------------------------------------
// Events
