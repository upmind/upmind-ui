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
    currency: ActorRef<any>;
    customFields: ActorRef<any>;
    promotions: ActorRef<any>;
    // --- only when a basket is claimed
    paymentDetail?: ActorRef<any>;
    billing?: ActorRef<any>;
  };
  authHelper?: ActorRef<any>;
  payment?: ActorRef<any>;
  attempts?: number;
  // --- Payment
  paymentDetail?: PaymentDetailData;
}
