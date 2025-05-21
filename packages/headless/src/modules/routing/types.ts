// --- types
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------

export enum ROUTE {
  LOADING = "loading",
  ERROR = "error",
  EMPTY = "empty",
  PRODUCT_ADD = "product.add",
  PRODUCT_EDIT = "product.edit",
  PRODUCT_REQUIRES_ACTION = "product.requiresAction",
  PRODUCT_NOT_FOUND = "product.notFound",
  PRODUCT_RECOMMENDATIONS = "product.recommendations",
  RECOMMENDATIONS = "recommendations",
  SESSION = "session",
  SESSION_LOGIN = "session.login",
  SESSION_REGISTER = "session.register",
  SESSION_RECOVER_PASSWORD = "session.recover",
  SESSION_END = "session.end",
  SESSION_TRANSFER = "session.transfer",
  BASKET = "basket",
  CHECKOUT = "checkout",
  ORDER = "order",
  // --- express routes
  EXPRESS_PRODUCT_ADD = "express.product.add",
  EXPRESS_CHECKOUT = "express.checkout",
  // --- redirect routes
  REDIRECT_EXTERNAL = "redirect.external",
  REDIRECT_INTERNAL = "redirect.internal",
}

export enum REQUIRES_ACTION {
  PENDING = "pending",
  INVALID = "invalid",
  RELATED = "related",
}

export interface PageRoute {
  to?: {
    fullPath: string;
    name?: string | symbol;
    params?: Record<string, string | string[]>;
  };
  from?: {
    fullPath: string;
    name?: string | symbol;
    params?: Record<string, string | string[]>;
  };
}

export type Route = {
  path?: string;
  name?: string;
  params?: Record<string, string | string[]>;
  query?: Record<string, any>;
  meta?: Record<string, any>;
};

export type Target =
  | ROUTE
  | {
      name: ROUTE | string;
      guard?: (route: Route, data?: any) => Promise<boolean>;
      resolve?: (route: Route, data?: any) => Promise<Route>;
      meta?: Record<string, any>;
    };

export interface Flow {
  name: ROUTE | string;
  guard?: (route: Route, data?: any) => Promise<boolean>;
  resolve?: (route: Route, data?: any) => Promise<Route>;
  meta?: Record<string, any> & {
    replace?: boolean; // this is so we know to replace the current route instead of redirecting
  };
  targets?: {
    next?: Target[];
    back?: Target[];
    fallback?: Target[];
  };
}

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
