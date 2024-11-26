// --- types
import type { ActorRef } from "xstate";

import type { BasketProduct } from "../basket/types";
import type { ProductModel } from "../product/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface RecommendationsEngineContext {
  id: string;
  clientId: string; //IClient["id"];
  currencyId: string; //IProductPrice["currency_id"];
  accountId: string; //IProductPrice["account_id"];
  promotions: any[]; //IPromotion[];
  // ---
  lookups: {
    products?: any;
  };
  // ---
  error?: any;
  controller?: AbortController;
  // ---
  basketId?: string;
  basketHelper?: ActorRef<any>;
  itemBuilder?: (item: ProductModel) => ProductModel;
  itemMapper?: (item: BasketProduct) => Partial<BasketProduct>;
  basketItemMapper?: (item: BasketProduct) => Partial<BasketProduct>;
}

// --------------------------------------------------------
// Events

export interface RecommendationsEngineEvents {
  type: "CHECK" | "REFRESH";
  data?: any;
  error?: any;
}
