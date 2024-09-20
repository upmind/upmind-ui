// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface ProductConfigContext {
  id: string;
  // basket_id: string; //IBasket["id"];
  client_id: string; //IClient["id"];
  // TODO:
  // currency_id: IProductPrice["currency_id"];
  currency_id: any["currency_id"];
  promotions: IProductPromotion[];
  baseModel: IProductModel;
  model: IProductModel;
  // ---
  raw?: Object;
  lookups: {
    // TODO:
    // product?: IProduct;
    // terms?: array;
    // options?: array;
    // attributes?: array;
    product?: any;
    terms?: any[];
    options?: any[];
    attributes?: any[];
  };
  // ---
  config?: IProductConfig;
  // TODO:
  // summary?: IProductSummary;
  summary?: any;
  prices?: {
    term: { subtotal: number; total: number; discount: number };
    attributes: { subtotal: number; total: number; discount: number };
    options: { subtotal: number; total: number; discount: number };
  };
  // ---
  // TODO:
  // calculateCallback?: ActorRef<any, any>;
  // error?: RequestError;
  // errorExternal: RequestError;
  calculateCallback?: any;
  error?: any;
  errorExternal: any;
  // ---
  basket_id?: string;
  // TODO:
  // basket_product?: IBasketProduct;
  basket_product?: any;
  basketHelper?: Function;
  itemBuilder?: Function;
  itemMapper?: Function;
  basketItemBuilder?: Function;
  basketItemMapper?: Function;
}

export interface IProductModel {
  id?: string; // this is only when it exists in the basket
  // ---
  // TODO:
  // product_id: IProduct["id"];
  // quantity: IProduct["unit_quantity"];
  product_id: any["id"];
  quantity: any["unit_quantity"]; // Configuration quantity
  // ---
  // TODO:
  // term?: IProductTerm;
  // attributes?: array;
  // options?: array;
  // provision_fields?: array;
  term?: any;
  attributes?: any[];
  options?: any[];
  provision_fields?: any[];
  start_trial?: boolean;
  // ---
  // TODO:
  // currency_id?: IProductPrice["currency_id"];
  currency_id?: any["currency_id"];
  promotions?: IProductPromotion[];
  // ---
  prices?: {
    term: { subtotal: number; total: number; discount: number };
    attributes: { subtotal: number; total: number; discount: number };
    options: { subtotal: number; total: number; discount: number };
  };
}

export interface IProductConfig {
  id?: string; // this is only when it exists in the basket
  // ---
  attributes: {
    // TODO:
    // product_id: IProductAttribute["id"];
    product_id: any["id"];
  }[];
  // TODO:
  // billing_cycle_months: IProductPrice["billing_cycle_months"];
  billing_cycle_months: any["billing_cycle_months"];
  options: {
    // TODO:
    // billing_cycle_months: IProductOption["billing_cycle_months"];
    // order_type?: IProductOption["order_type"];
    // product_id: IProductOption["id"];
    billing_cycle_months: any["billing_cycle_months"];
    order_type?: any["order_type"];
    product_id: any["id"];
    selling_price?: number;
    total?: number;
    // TODO:
    // unit_quantity: IProductOption["unit_quantity"];
    unit_quantity: any["unit_quantity"];
    unit_total?: number;
  }[];
  // TODO:
  // product_id: IProduct["id"];
  product_id: any["id"];
  promotions?: { promocode: string }[];
  // TODO:
  // currency_id: IProductPrice["currency_id"];
  // quantity: IProduct["unit_quantity"];
  currency_id: any["currency_id"];
  quantity: any["unit_quantity"]; // Configuration quantity
  start_trial?: boolean;
}

export interface IProductPromotion {
  promocode: string;
}

export interface BasketContext {
  // TODO:
  // basket: Basket | null;
  // items: Array;
  // error?: RequestError;
  basket: any;
  items: any[];
  error?: any;
}

// --------------------------------------------------------
// Events

export interface ProductConfigEvent {
  type: "CHECK" | "REFRESH";
  // TODO:
  // data?: IBasket;
  // error?: RequestError;
  data?: any;
  error?: any;
}
