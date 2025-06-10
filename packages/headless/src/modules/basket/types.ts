// --- external
import type { ActorRef } from "xstate";
import type { IBasket, IInvoice } from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct";
import type { QueryResponseError } from "../query/types";
// -----------------------------------------------------------------------------

export interface BasketContext {
  basket?: IBasket;
  invoice?: IInvoice;
  // ---
  products: BasketProduct[]; // Array of products in the basket
  // ---
  error?: QueryResponseError;
  controller?: AbortController;
  summary?: any; //TODO: define summary type
  // --- SPAWNED ACTORS/MACHINES
  actors?: {
    billingDetails: ActorRef<any>;
    currency: ActorRef<any>;
    customFields: ActorRef<any>;
    paymentDetails: ActorRef<any>;
    promotions: ActorRef<any>;
  };
  authHelper?: ActorRef<any>;
  // --- Payments
  paymentDetails?: any;
  // TODO: define payment details type correctly and refactor the paymentdetails machine/response
  // IPaymentDetail & {
  //   tracking?: Record<string, any>;
  //   referral_cookie: string | Record<string, any>;
  // };
  payment?: ActorRef<any>;
}
