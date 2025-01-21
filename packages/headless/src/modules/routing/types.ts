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

export enum REQUIRES_ACTION {
  PENDING = "pending",
  INVALID = "invalid",
  RELATED = "related",
}

export interface Route {
  path?: string;
  name?: string;
  params?: Record<string, string | string[]>;
  query?: Record<string, any>;
}

export interface Flow {
  name: ROUTE;
  // handler?: (router: any, route: ROUTE) => Promise<void>;
  guard?: (route: Route, data?: any) => Promise<boolean>;
  resolve?: (route: Route, data?: any) => Promise<Route>;
  targets?: {
    next?: {
      name: ROUTE;
      guard?: (route: Route, data?: any) => Promise<boolean>;
      resolve?: (route: Route, data?: any) => Promise<Route>;
    }[];
    back?: {
      name: ROUTE;
      guard?: (route: Route, data?: any) => Promise<boolean>;
      resolve?: (route: Route, data?: any) => Promise<Route>;
    }[];
    fallback?: {
      name: ROUTE;
      guard?: (route: Route, data?: any) => Promise<boolean>;
      resolve?: (route: Route, data?: any) => Promise<Route>;
    }[];
  };
}

// --------------------------------------------------------
// Contexts

export interface RoutingEngineContext {
  flows: Flow[];
  currentFlow?: Flow;
  currentRoute?: Route;
  // ---
  error?: any;
  // ---
  basketId?: string;
  basketHelper?: ActorRef<any>;
}

// --------------------------------------------------------
// Events
