import type { ResponseError } from "../../utils";
import type {
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded
} from "vue-router";
import type {
  AnyEventObject,
  MachineOptions,
  StateMachine,
  StateNodesConfig
} from "xstate";

export { QUERY_PARAMS } from "@upmind-automation/types";
// -----------------------------------------------------------------------------

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
export type PageRoute = {
  /**
   * Details about the target route.
   */
  to?: RouteLocationNormalized;
  /**
   * Details about the route from which navigation originated.
   */
  from?: RouteLocationNormalizedLoaded;
};

type FunnelMachineOptions = MachineOptions<FunnelContext, AnyEventObject>;

export type FunnelProps = {
  id: string;
  states: StateNodesConfig<
    FunnelContext,
    StateMachine<FunnelContext, any, AnyEventObject>["schema"],
    any
  >;
  context?: FunnelContext;
  /** Endpoint state nodes generated from overlay definitions (merged in services.ts). */
  endpoints?: Pick<FunnelProps, "states" | "guards" | "actions">;
} & Pick<FunnelMachineOptions, "guards" | "services" | "actions">;

export type Funnels = Record<string, FunnelProps>;
/**
 * Interface representing the context for the routing engine, typically managed by an XState machine.
 * It holds the state of active flows, current route, and references to other services.
 */
export type RoutingEngineContext = {
  /**
   * A dictionary of all available funnels, keyed by their unique IDs.
   * The values of the dictionary are the funnel configurations used in the Factory function used to create funnel machines.
   */
  funnels: Funnels;

  /**
   * The actual funnel machine instance currently in use.
   * This is interpreted from the funnel configuration, based on the current funnel (ID).
   */
  funnel?: StateMachine<FunnelContext, any, AnyEventObject, any>;

  /**
   * The ID of the default funnel to fall back to when no specific funnel is active or provided.
   */
  defaultFunnel: string;

  /**
   * The target route that the routing engine is attempting to resolve or navigate to upon funnel invocation.
   */
  targetRoute?: FunnelTarget;

  /**
   * The ID of the currently active funnel being processed by the routing engine.
   */
  currentFunnel: string;

  /**
   * Reactive watchers registered alongside funnels.
   * Passed through to the funnel context during prepare().
   */
  watchers?: FunnelWatcher[];

  /**
   * Overlay registry mapping path suffixes to route names.
   * Used to generate endpoint state nodes for overlay routing.
   */
  overlays?: Record<string, string>;

  // ---
  /**
   * An error object encountered by the routing engine.
   */
  error?: ResponseError;
  // ---
};

/**
 * Interface representing the context for the funnel, typically managed by an XState machine.
 * It holds the state of active flows, current route, and references to other services.
 */
export type FunnelContext = {
  /**
   * The current route object being managed by the funnel.
   */
  currentRoute?: RouteLocation;

  /**
   * The target route that the funnel is attempting to resolve or navigate to.
   */
  targetRoute?: FunnelTarget;

  /**
   * A boolean indicating whether the funnel has completed its resolution process.
   */
  resolved?: boolean;

  /**
   * True if the last RESOLVE fell through to idle (no state matched the route).
   * Useful for diagnostics — check in dev-mode to catch misconfigured funnels.
   */
  fallbackResolved?: boolean;

  /**
   * Reactive watchers to invoke as callbacks when the funnel is in the `available` state.
   * Each watcher subscribes to a reactive source and triggers navigation through the pipeline.
   */
  watchers?: FunnelWatcher[];

  // ---
  /**
   * An error object encountered by the funnel.
   */
  error?: ResponseError;
};

export type FunnelTarget = {
  name?: RouteLocationNormalized["name"];
  path?: RouteLocationNormalized["path"];
  params?: RouteLocationNormalized["params"];
  query?: RouteLocationNormalized["query"];
  hash?: RouteLocationNormalized["hash"];
  meta?: RouteLocationNormalized["meta"];
};

export type FunnelResponse = {
  type?: FunnelActions;
  target?: FunnelTarget;
};

/**
 * Alternative guard payload (resolve/reject) for rendering an overlay over a
 * base route. The `setOverlay` action turns this into a `{base}--{overlayId}`
 * target, looking the overlay id up in the overlay registry. Funnel-agnostic —
 * `target` is the base FunnelTarget the overlay renders over (carrying any
 * params/query), `overlay` is the registered overlay route name.
 */
export type OverlayResponse = FunnelResponse & {
  type?: FunnelActions.OVERLAY;
  target?: FunnelTarget;
  /** The overlay route to display — must be a registered overlay. */
  overlay: string;
};

export enum FunnelActions {
  NEXT = "NEXT",
  BACK = "BACK",
  REDIRECT = "REDIRECT",
  OVERLAY = "OVERLAY"
}

// --- watcher types

/**
 * A reactive watcher that subscribes to state changes and triggers
 * navigation through the funnel pipeline.
 *
 * Must return a cleanup function (unsubscribe).
 * The watcher receives the funnel context for `resolved` mutex checking.
 */
export type FunnelWatcher = {
  /** Unique identifier for this watcher (e.g. 'session-logout') */
  id: string;
  /** The invoked callback function. Receives `sendBack` (unused) and `onReceive` (unused). */
  handler: FunnelWatcherHandler;
};

/**
 * Signature for the watcher handler function.
 * Sets up a reactive subscription and returns a cleanup function.
 * Must be self-contained — the handler manages its own lifecycle.
 */
export type FunnelWatcherHandler = () => () => void;

/**
 * A single conditional navigation target.
 * Used in meta.next / meta.prev arrays for guard-based routing.
 */
export type FunnelMetaTarget = {
  /** Route name to navigate to. */
  target: string;
  /** Guard name — when omitted this entry acts as the default fallback. */
  cond?: string;
};

/**
 * Meta properties for funnel state nodes.
 * Used by the factory to auto-generate NEXT/BACK handlers (FE-2583).
 *
 * `next` / `prev` accept either:
 * - A **string** — unconditional target (simple case).
 * - An **array of FunnelMetaTarget** — evaluated in order; first matching
 *   `cond` wins. Omit `cond` on the last entry for a default fallback.
 */
export type FunnelStateMeta = {
  /** Route name (or conditional targets) for NEXT navigation. */
  next?: string | FunnelMetaTarget[];
  /** Route name (or conditional targets) for BACK navigation. */
  prev?: string | FunnelMetaTarget[];
  /** Step position for progress tracking (1-indexed). */
  step?: number;
  /** Human-readable label for breadcrumbs / progress indicators. */
  label?: string;
  /** Whether this state is a decision node (no UI). */
  decision?: boolean;
};

// --- overlay types

/**
 * Enumeration representing the UI container type for overlay routes.
 */
export enum OverlayType {
  MODAL = "modal",
  DRAWER = "drawer",
  CUSTOM = "custom"
}

/**
 * Definition for an overlay route that can be injected as a child on eligible routes.
 */
export type OverlayDefinition = {
  /** Path segment appended to parent route */
  path: string;
  /** Unique identifier for this overlay type */
  id: string;
  /** Default render type — brands can override via UI meta */
  defaultType: OverlayType;
  /** Guard service name to invoke when this overlay route is matched by the funnel */
  guard?: string;
};

// --- Vue Router meta extension

declare module "vue-router" {
  interface RouteMeta {
    /** When set, indicates this route renders as an overlay (modal or drawer) */
    overlay?: OverlayType;
    /** The overlay identifier: 'auth', '2fa', 'verify-email', etc. */
    overlayId?: string;
    /** Set to false to prevent overlay child routes from being injected */
    allowOverlays?: boolean;
    /**
     * When true, the funnel redirects to the basket-empty route if the basket
     * has no products. Routes that render basket contents should set this.
     */
    actionEmptyBasket?: boolean;
    /**
     * When true, this route replaces the current history entry rather than
     * pushing a new one. Used on transitional routes like loading.
     */
    replace?: boolean;
  }
}
