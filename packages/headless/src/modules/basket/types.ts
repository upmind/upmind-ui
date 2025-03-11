// --- external
import type { ActorRef } from "xstate";
import type { responseCodes } from "../../utils";
import type { IBasket } from "@upmind-automation/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------

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
  product_id?: any;
  id: string; // the basket product id (bpid)

  // --- Model
  productId: string;
  quantity: number;
  term: number;
  options?: ISubProductChoices;
  attributes?: ISubProductChoices;
  provisionFields?: Record<string, any>;

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

export type BasketProductDetails = {
  id: string;
  name: string;
  category: string;
  serviceIdentifier?: string;
  description?: string;
  excerpt?: string;
  imgUrl?: string;
  meta?: Record<string, any> | null;
  // ---
  quantifiable?: boolean;
  min?: number;
  max?: number;
  step?: number;
};

export interface BasketProductSummaryDetail extends Price {
  key: string;
  category: string;
  name: any;
  serviceIdentifier?: string;
  cycle?: number;
  quantity?: number;
  meta?: {
    oneoff?: boolean;
    quantifiable?: boolean;
    discounted?: boolean;
    free?: boolean;
    invalid?: boolean;
    overrides?: boolean;
    includes?: boolean;
  };
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

// --------------------------------------------------------
// Contexts

export interface BasketContext {
  basket?: IBasket;
  invoice?: any; //IInvoice;
  // ---
  items?: ActorRef<any>[]; // Array of actors of items pending or basket products being configured
  products: BasketProduct[]; // Array of products in the basket
  // ---
  error?: {
    code?: string | responseCodes;
    title?: string;
    message?: string;
    data?: any;
    provisioningErrors?: Record<string, any>;
  };
  controller?: AbortController;
  summary?: any; //IBasketSummary;
  // --- SPAWNED ACTORS/MACHINES
  actors: {
    billingDetails?: ActorRef<any>;
    currency?: ActorRef<any>;
    customFields?: ActorRef<any>;
    paymentDetails?: ActorRef<any>;
    promotions?: ActorRef<any>;
  };
  // --- Payments
  paymentDetails?: any; //IPaymentDetail;
  payment?: ActorRef<any>;
}
