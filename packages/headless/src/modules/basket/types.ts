// --- external
import type { ActorRef } from "xstate";
import type { responseCodes } from "../../utils";
import type { IBasket } from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct";
// -----------------------------------------------------------------------------

export interface BasketContext {
  basket?: IBasket;
  invoice?: any; //IInvoice;
  // ---
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
  authHelper?: ActorRef<any>;
  // --- Payments
  paymentDetails?: any; //IPaymentDetail;
  payment?: ActorRef<any>;
}
