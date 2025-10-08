// --- external
import type { ActorRef } from "xstate";
import type { ResponseError } from "../../utils";
import type { BasketProduct } from "../basketProduct";
import type { IBasket, IInvoice } from "@upmind-automation/types";
import { PaymentDetailData } from "../paymentDetails";

// -----------------------------------------------------------------------------

export interface BasketContext {
  basket?: IBasket;
  invoice?: IInvoice;
  // ---
  products: BasketProduct[]; // Array of products in the basket
  // ---
  error?: ResponseError;
  controller?: AbortController;
  summary?: {
    products: BasketProduct[];
    discount: string | null;
    subtotal: string;
    taxes: { title: string; amount: string }[];
    total: string;
  };
  // --- SPAWNED ACTORS/MACHINES
  actors?: {
    billing: ActorRef<any>;
    currency: ActorRef<any>;
    customFields: ActorRef<any>;
    paymentDetail: ActorRef<any>;
    promotions: ActorRef<any>;
  };
  authHelper?: ActorRef<any>;
  payment?: ActorRef<any>;
  // --- Payment
  paymentDetail?: PaymentDetailData;
}
