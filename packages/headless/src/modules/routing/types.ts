// --- types
import type { ActorRef, AnyEventObject } from "xstate";

// --------------------------------------------------------
//

export enum ROUTE {
  LOADING = "loading",
  EMPTY = "empty",
  PRODUCT_ADD = "product.add",
  PRODUCT_EDIT = "product.edit",
  PRODUCT_REQUIRES_ACTION = "product.requiresAction",
  PRODUCT_NOT_FOUND = "product.notFound",
  RECOMMENDATIONS = "recommendations",
  SESSION = "session",
  SESSION_LOGIN = "session.login",
  SESSION_REGISTER = "session.register",
  SESSION_FORGOT_PASSWORD = "session.forgot",
  BASKET = "basket",
  CHECKOUT = "checkout",
  ORDER = "order",
}

export interface Route {
  path: string;
  params?: Record<string, string | string[]>;
  query?: Record<string, any>;
}

export interface Flow {
  id: ROUTE;
  name?: string;
  path?: string;
  // handler?: (context: any, event: AnyEventObject) => void;
  guard?: (route: Route) => Promise<boolean>;
  targets?: {
    next?: {
      id: ROUTE;
      guard?: (route: Route) => Promise<boolean>;
    }[];
    back?: {
      id: ROUTE;
      guard?: (route: Route) => Promise<boolean>;
    }[];
    fallback?: {
      id: ROUTE;
      guard?: (route: Route) => Promise<boolean>;
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
