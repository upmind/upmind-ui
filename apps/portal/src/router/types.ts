// --- types
import type { ResponseError } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

/**
 * Enumeration representing predefined application routes and navigational paths.
 * These routes are used consistently throughout the Upmind frontend for navigation,
 * deep linking, and managing application state transitions.
 *
 * @enum {string}
 */
export enum ROUTE {
  /**
   * Represents a loading state, typically displayed while data is being fetched or processed.
   */
  LOADING = "loading",
  /**
   * Represents an error state, displayed when an unrecoverable error occurs.
   */
  ERROR = "error",
  /**
   * Represents an unavailable state, indicating a resource or feature is not currently accessible.
   */
  UNAVAILABLE = "unavailable",
  // --- account routes
  /**
   * The route for client account.
   */
  ACCOUNT = "account",
  // --- account profile routes
  /**
   * The route for client account.
   */
  ACCOUNT_PROFILE = "account.profile",
  // --- account child accounts routes
  /**
   * The route for client account child accounts.
   */
  ACCOUNT_CHILD_ACCOUNTS = "account.childAccounts",
  // --- account delegates routes
  /**
   * The route for client account delegates.
   */
  ACCOUNT_DELEGATES = "account.delegates",
  // --- account delegate route
  /**
   * The route for client account delegate.
   */
  ACCOUNT_DELEGATES_DELEGATE = "account.delegates.delegate",
  // --- account notifications route
  /**
   * The route for client account notifications.
   */
  ACCOUNT_NOTIFICATIONS = "account.notifications",
  // --- account email history route
  /**
   * The route for client account email history.
   */
  ACCOUNT_EMAIL_HISTORY = "account.emailHistory",
  // --- account security route
  /**
   * The route for the account security.
   */
  ACCOUNT_SECURITY = "account.security",
  /**
   * The route for the affiliate section of the client account.
   */
  ACCOUNT_AFFILIATE = "account.affiliate",
  /**
   * The route for the notes section of the client account.
   */
  ACCOUNT_NOTES = "account.notes",
  // --- shop routes
  /**
   * The route for the main product catalogue or shop page.
   */
  CATALOGUE = "catalogue",
  // --- product routes
  /**
   * The route for adding a new product.
   */
  PRODUCT_ADD = "product.add",
  /**
   * The route for editing an existing product.
   */
  PRODUCT_EDIT = "product.edit",
  /**
   * The route to display products that require specific actions from the user.
   */
  PRODUCT_REQUIRES_ACTION = "product.requiresAction",
  /**
   * The route displayed when a requested product cannot be found.
   */
  PRODUCT_NOT_FOUND = "product.notFound",
  /**
   * The route for displaying product recommendations.
   */
  PRODUCT_RECOMMENDATIONS = "product.recommendations",
  // --- product flows
  /**
   * Generic route for product recommendation flows.
   */
  RECOMMENDATIONS = "recommendations",
  // --- SESSION/AUTH routes
  /**
   * The base route for session and authentication related pages.
   */
  SESSION = "session",
  /**
   * The route for the user login page.
   */
  SESSION_LOGIN = "session.login",
  /**
   * The route for the user registration page.
   */
  SESSION_REGISTER = "session.register",
  /**
   * The route for the password recovery/reset page.
   */
  SESSION_RECOVER_PASSWORD = "session.recover",
  /**
   * The route indicating the end of a session, typically after logout.
   */
  SESSION_END = "session.end",
  /**
   * The route for handling session transfer operations between contexts.
   */
  SESSION_TRANSFER = "session.transfer",
  // --- basket routes
  /**
   * The route for an empty shopping basket.
   */
  EMPTY = "empty",
  /**
   * The route for viewing the shopping basket contents.
   */
  BASKET = "basket",
  /**
   * The route for the checkout process.
   */
  CHECKOUT = "checkout",
  /**
   * The route for viewing a completed order.
   */
  ORDER = "order",
  // --- express routes
  /**
   * The route for quickly adding a product in an express flow.
   */
  EXPRESS_PRODUCT_ADD = "express.product.add",
  /**
   * The route for an express checkout flow.
   */
  EXPRESS_CHECKOUT = "express.checkout",
  // --- redirect routes
  /**
   * The route indicating a redirection to an external URL.
   */
  REDIRECT_EXTERNAL = "redirect.external",
  /**
   * The route indicating a redirection to an internal application route.
   */
  REDIRECT_INTERNAL = "redirect.internal"
}

/**
 * Enumeration representing various states or conditions that may require an action to be taken by the user or system.
 * This is often used in contexts like product configuration, order validation, or resource management.
 *
 * @enum {string}
 */
export enum REQUIRES_ACTION {
  /**
   * Indicates that an action is pending and has not yet been completed.
   * For example, a product configuration awaiting user input or a service provisioning awaiting completion.
   */
  PENDING = "pending",
  /**
   * Indicates that the current state or configuration is invalid and corrective action is required.
   * For example, missing required fields in a form or an incompatible product selection.
   */
  INVALID = "invalid",
  /**
   * Indicates that the state is related to another entity or process and may require attention.
   * For example, a product might require action if a related domain or hosting service has an issue.
   */
  RELATED = "related"
}

/**
 * Interface representing details about a page route, typically including both the target route
 * and the route from which the navigation originated.
 */
export interface PageRoute {
  /**
   * Details about the target route.
   */
  to?: {
    /** The full path of the target route. */
    fullPath: string;
    /** The name of the target route, if available. */
    name?: string | symbol;
    /** Parameters associated with the target route. */
    params?: Record<string, string | string[]>;
  };
  /**
   * Details about the route from which navigation originated.
   */
  from?: {
    /** The full path of the originating route. */
    fullPath: string;
    /** The name of the originating route, if available. */
    name?: string | symbol;
    /** Parameters associated with the originating route. */
    params?: Record<string, string | string[]>;
  };
}

/**
 * Type alias for a generic route object, providing common properties found in router configurations.
 */
export type Route = {
  /** The path segment of the route. */
  path?: string;
  /** The name of the route. */
  name?: string;
  /** Route parameters, e.g., `/users/:id` would have `{ id: 'some-id' }`. */
  params?: Record<string, string | string[]>;
  /** Query parameters, e.g., `/search?q=query` would have `{ q: 'query' }`. */
  query?: Record<string, any>;
  /** The hash fragment of the route, e.g., `/page#section` would have `#section`.*/
  hash?: string;
  /** Meta fields associated with the route, for custom data. */
  meta?: Record<string, any>;
};

/**
 * Type alias for a navigational target, which can be either a predefined `ROUTE` enum member
 * or a more complex object defining guard, resolve, and meta properties.
 */
export type Target =
  | ROUTE // A simple predefined route from the ROUTE enum
  | {
      /** The name of the target route. Can be a ROUTE enum member or a custom string. */
      name: ROUTE | string;
      /**
       * An asynchronous guard function that determines if navigation to this target is allowed.
       * @param route - The target route object.
       * @param data - Optional additional data passed to the guard.
       * @returns A promise resolving to `true` to allow navigation, `false` to prevent it.
       */
      guard?: (route: Route, data?: any) => Promise<boolean>;
      /**
       * An asynchronous resolve function that can modify the target route object before navigation.
       * @param route - The target route object.
       * @param data - Optional additional data passed to the resolver.
       * @returns A promise resolving to the (potentially modified) target route object.
       */
      resolve?: (route: Route, data?: any) => Promise<Route>;
      /**
       * Meta fields associated with this target, providing custom data.
       */
      meta?: Record<string, any>;
    };

/**
 * Interface representing a navigational flow within the application, defining a sequence
 * of routes, guards, and resolution logic for complex user journeys.
 */
export interface Flow {
  /**
   * The name of the flow, which can be a predefined `ROUTE` enum member or a custom string.
   */
  name: ROUTE | string;
  /**
   * An asynchronous guard function that determines if the flow can be initiated or continued.
   * @param route - The current route object.
   * @param data - Optional additional data passed to the guard.
   * @returns A promise resolving to `true` to allow the flow, `false` to prevent it.
   */
  guard?: (route: Route, data?: any) => Promise<boolean>;
  /**
   * An asynchronous resolve function that can modify the current route object within the flow.
   * @param route - The current route object.
   * @param data - Optional additional data passed to the resolver.
   * @returns A promise resolving to the (potentially modified) route object.
   */
  resolve?: (route: Route, data?: any) => Promise<Route>;
  /**
   * Meta fields associated with the flow, including special flags like `replace`.
   */
  meta?: Record<string, any> & {
    /**
     * If `true`, indicates that the current route in the browser history should be replaced
     * instead of pushing a new entry when navigating within this flow.
     */
    replace?: boolean;
  };
  /**
   * Defines the potential next, back, and fallback targets within this flow.
   */
  targets?: {
    /** An array of possible next targets the flow can transition to. */
    next?: Target[];
    /** An array of possible previous targets the flow can transition back to. */
    back?: Target[];
    /** An array of fallback targets to use if `next` or `back` transitions fail. */
    fallback?: Target[];
  };
}

/**
 * Interface representing the context for the routing engine, typically managed by an XState machine.
 * It holds the state of active flows, current route, and references to other services.
 */
export interface RoutingEngineContext {
  /**
   * An array of active or defined navigational flows.
   */
  flows: Flow[];
  /**
   * The currently active flow in the routing engine.
   */
  currentFlow?: Flow;
  /**
   * The current route object being managed by the routing engine.
   */
  currentRoute?: Route;
  // ---
  /**
   * An error object encountered by the routing engine.
   */
  error?: ResponseError;
  // ---
  /**
   * The ID of the current shopping basket, if applicable.
   */
  // basketId?: string;
  // /**
  //  * An ActorRef to the basket helper service, for inter-service communication.
  //  */
  // basketHelper?: ActorRef<any>;
}
