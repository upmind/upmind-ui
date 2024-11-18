// --- extrnal
import type { ActorRef } from "xstate";
// --------------------------------------------------------
// ENUMS

export enum TaxTagTypes {
  PERCENT = 1,
  FIXED = 2,
}

// --------------------------------------------------------
// Interfaces
export interface Basket {
  account: any; //IAccount;
  account_id: string; //IAccount["id"];
  address?: any; //IAddress;
  address_id: string; //IAddress["id"];
  balance: number;
  balance_formatted: string;
  brand: any; //IBrand;
  brand_id: string; //IBrand["id"];
  category: string; //IBasketCategory;
  category_id: string; // IBasketCategory["id"];
  client: any; //IClient;
  client_id: string; //IClient["id"];
  company_id?: string; //ICompany["id"];
  consolidation_invoice_id?: string; //IInvoice["id"];
  consolidation_status: number;
  contract_id?: string; //IContract["id"];
  create_datetime: string;
  created_at: string;
  credit_invoice_id?: string; //IInvoice["id"];
  credited: number;
  currency: any; //ICurrency;
  currency_id: string; //ICurrency["id"];
  custom_fields: any[]; //ICustomFieldValue[];
  deleted_at: string | number;
  due_date: string;
  gateway_id: string; //IGateway["id"];
  id: string;
  legacy: number;
  net_amount: number;
  net_amount_formatted: string;
  net_discount_amount: number;
  net_discount_amount_formatted: string;
  net_global_discount_amount: number;
  net_global_discount_amount_formatted: string;
  net_product_discount_amount: number;
  net_product_discount_amount_formatted: string;
  net_selling_price: number;
  net_selling_price_formatted: string;
  notes: string;
  number: string;
  paid_amount: number;
  paid_amount_converted: number;
  paid_amount_formatted: string;
  paid_datetime?: number;
  payment_details: any; //IPaymentDetail;
  payment_details_id: string; //IPaymentDetail["id"];
  pricelist_id: string; //IPricelist["id"];
  products: any[]; //IBasketProduct[]
  promotions: any[]; //IBasketPromotion[]
  refund_changed: string | number;
  refund_request: string | number;
  refund_status: number;
  reseller_account_id?: string; //IAccount["id"];
  status: any; //IStatus;
  status_id: string; //IStatus["id"];
  total_amount: number;
  total_amount_converted: number;
  total_amount_formatted: string;
  total_discount_amount: number;
  total_discount_amount_formatted: string;
  unpaid_amount: number;
  unpaid_amount_converted: number;
  unpaid_amount_formatted: string;
  updated_at: string;
  user_id: string; //IUser["id"];
  tax_amount: number;
  tax_amount_formatted: string;
  taxes: any[]; //IAppliedTax[]
  ip: string;
  warning_notes: any[]; //IWarningNote[];
}

type ISubProductChoices = Record<
  string, // the category id
  Record<
    string, // the subproduct id
    {
      productId: string;
      unitQuantity: number;
      cycle: number;
    }
  >
>;

export interface BasketProduct {
  id: string; // the basket product id (bpid)

  // --- model
  productId: string;
  quantity: number;
  term: { cycle: number };
  options?: ISubProductChoices;
  attributes?: ISubProductChoices;
  provisionFields?: Record<string, any>;

  // --- descriptive details
  name: string;
  category: string;
  serviceIdentifier?: string;
  description?: string;
  shortDescription?: string;

  // --- lookups/config
  product: {
    id: string;
    quantifiable?: boolean;
    min?: number;
    max?: number;
    step?: number;
  };

  // --- summary
  summary: {
    hasDiscount?: boolean;
    currentPrice?: number;
    currentPriceFormatted?: string;
    regularPrice?: number;
    regularPriceFormatted?: string;

    // --- prices breakdown for non quantifiable products
    // prices: [
    //   {
    //     price: number;
    //     priceFormatted: string;
    //     priceDiscounted?: number;
    //     priceDiscountedFormatted?: string;
    //   },
    // ];

    // --- details
    details: BasketProductDetail[];
  };
}

export interface BasketProductDetail {
  key: string;
  category: string;
  name: any;
  cycle?: number;
  quantity?: number;
  hasPricing?: boolean;
  hasDiscount?: boolean;
  currentPrice?: number;
  currentPriceFormatted?: string;
  regularPrice?: number;
  regularPriceFormatted?: string;
  invalid?: boolean;
}
// --------------------------------------------------------
// Contexts

export interface BasketContext {
  basket?: Basket;
  invoice?: any; //IInvoice;
  // ---
  items?: ActorRef<any, any>[]; // Array of actors of items pending or basket products being configured
  products: BasketProduct[]; // Array of products in the basket
  // ---
  error?: any;
  controller?: AbortController;
  summary?: any; //IBasketSummary;
  // --- SPAWNED ACTORS/MACHINES
  actors: {
    billingDetails?: ActorRef<any, any>;
    currency?: ActorRef<any, any>;
    customFields?: ActorRef<any, any>;
    paymentDetails?: ActorRef<any, any>;
    promotions?: ActorRef<any, any>;
  };
  // --- Payments
  paymentDetails?: ActorRef<any, any>;
  payment?: ActorRef<any, any>;
}

// --------------------------------------------------------
// Events

export interface BasketEvent {
  type: "CHECK" | "REFRESH" | "AUTHENTICATED";
  data?: any; //Basket;
  error?: any;
}
