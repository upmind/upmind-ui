// --- types
import type { ActorRef, AnyEventObject } from "xstate";

// --------------------------------------------------------
//

export enum ROUTE {
  LOADING = "available.loading",
  EMPTY = "available.empty",
  PRODUCT_ADD = "available.product.add",
  PRODUCT_EDIT = "available.product.edit",
  PRODUCT_REQUIRES_ACTION = "available.product.requiresAction",
  PRODUCT_NOT_FOUND = "available.product.notFound",
  RECOMMENDATIONS = "available.recommendations",
  LOGIN = "available.auth.login",
  REGISTER = "available.auth.register",
  FORGOT_PASSWORD = "available.auth.forgot",
  CART = "available.cart",
  CHECKOUT = "available.checkout",
  ORDER = "available.order",
}

export interface Flow {
  id: ROUTE;
  handler?: (context: any, event: AnyEventObject) => void;
  guard?: (context: any, event: AnyEventObject) => boolean;

  targets?: {
    next?: {
      id: ROUTE;
      guard: (context: any, event: AnyEventObject) => boolean;
    }[];
    back?: {
      id: ROUTE;
      guard: (context: any, event: AnyEventObject) => boolean;
    }[];
    fallback?: {
      id: ROUTE;
      guard: (context: any, event: AnyEventObject) => boolean;
    }[];
  };
}

// --------------------------------------------------------
// Contexts

export interface RoutingEngineContext {
  flows: Flow[];
  currentFlow?: Flow;
  // ---
  error?: any;
  // ---
  basketId?: string;
  basketHelper?: ActorRef<any>;
}

// --------------------------------------------------------
// Events
