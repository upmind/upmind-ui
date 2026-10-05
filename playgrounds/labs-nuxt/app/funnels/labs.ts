import { AUTH_FORMS } from "@upmind-automation/auth";
import { assign, QUERY_PARAMS } from "@upmind-automation/headless";
import {
  AUTH_SCOPE_MATRIX,
  ScopeActorTypes
} from "@upmind-automation/headless";
import { scenarioRoutes } from "../../modules/scenarios/runtime/registry";
import actions from "./engine/actions";
import guards from "./engine/guards";
import services from "./engine/services";
import { ACTOR_PARAM, ADD_SESSION_PARAM, MODE_PARAM } from "./labs.constants";
import { ROUTE } from "./types";
import { get, isArray, join, mapValues, omit, toString } from "lodash-es";
import type {
  AnyEventObject,
  FunnelContext,
  FunnelProps
} from "@upmind-automation/headless";
import type { LocationQuery, RouteLocation } from "vue-router";
import { parseScopeSuffix } from "~/composables/scope/scope-mapper";

// -----------------------------------------------------------------------------

/**
 * The overlay suffix `registerOverlayRoutes` injects the auth modal under — the
 * key of `LABS_OVERLAYS`, which is where the reason it is not `auth` is written.
 */
const AUTH_OVERLAY_ID = "session";

/**
 * The overlay suffix `registerOverlayRoutes` injects the pay modal under — the
 * key of `LABS_OVERLAYS`, matching the `--pay` child of the order page.
 */
const PAY_OVERLAY_ID = "pay";

/**
 * The actor a session is collected for when the entry names none — the one the
 * url carries, which is the only thing that moves a page off SELF (`R6-30b`).
 * That is what `guardScenario` rejects on, so the overlay opens on the journey
 * the gate was actually short of.
 */
function routeActor(params?: RouteLocation["params"]) {
  const suffix = get(params, "scopeSuffix");

  return parseScopeSuffix(
    isArray(suffix) ? join(suffix, "/") : toString(suffix)
  ).actor;
}

/**
 * The actor an entry actually NAMED — `useAuth`'s own matrix is the authority,
 * and it declares SELF and GUEST `never`, so neither is a journey anyone can be
 * said to have asked for.
 */
export function authNamedActor(
  actor?: ScopeActorTypes
): ScopeActorTypes | undefined {
  return get(AUTH_SCOPE_MATRIX, toString(actor))
    ? (actor as ScopeActorTypes)
    : undefined;
}

/**
 * The actor a sign-in journey is collected FOR — one the matrix does not carry
 * collects as CLIENT, this playground's module pages being the client area;
 * staff arrives by `/as/user` or the pool's own add-staff control.
 *
 * Asking for SELF is what made the gate unusable: the scope builder resolves
 * SELF to the ACTIVE actor, which for a visitor with no session is GUEST, and
 * the guest arm mints a token and settles in the machine's FINAL `authenticated`
 * state — so the overlay drew "authenticated as guest" over the very page the
 * guard had just refused, offering a logout instead of a login.
 *
 * Which is a different question from who was NAMED, and conflating the two is
 * what then locked the gate (`R7-1`): the fallback answered "collect a client"
 * where nobody had asked for anything, so a guest or staff arrival was handed
 * the client journey with no way to say otherwise.
 */
export function authCollectActor(actor?: ScopeActorTypes): ScopeActorTypes {
  return authNamedActor(actor) ?? ScopeActorTypes.CLIENT;
}

/** The page an overlay is a child of — its own route name, less the suffix. */
function overlayParent(route?: Pick<RouteLocation, "name">) {
  return toString(route?.name).replace(/--[^-]+$/, "");
}

/**
 * The auth overlay's location over a page — the `<route>--session` name the overlay
 * registry injects, carrying that page's own params so the scope the url named
 * survives the round trip.
 *
 * The target NAMES THE ACTOR it wants a session for (`R6-15b`), because the
 * overlay renders the `useAuth` page's own journey and that journey is chosen by
 * `/as/<actor>` — so "Add another staff session" passes staff, the guard passes
 * whatever it rejected on, and the staff arm comes free. It rides the query
 * rather than `scopeSuffix`: the overlay is a CHILD of the page, so a path write
 * would re-scope the page underneath as well.
 *
 * The GUARD names one only when the url did (`R7-1`). Add-session is always
 * taken from a control that says which kind, so that arm always names it; the
 * gate is an arrival, and a page reached without `/as/<actor>` has been asked
 * for by nobody in particular — so it carries no actor and the overlay opens on
 * its chooser instead of assuming the page's declared one.
 *
 * `fresh` is the whole ADD-SESSION ≠ LOG-IN-TO-PROCEED split (`H5`), stated
 * once, here. With it the journey spawns a session beside the ones the pool
 * already holds, and no cancel url is set, so dismissing lands back on the page
 * underneath — which was usable all along. Without it this is the guard's own
 * rejection, with HOME as the way out of a page that cannot render without a
 * session.
 *
 * The `fresh` value is a remount nonce read for presence only — the contract the
 * `useAuth` page already reads the marker under, and the reason a second
 * add-session re-opens the overlay rather than resolving to the same location.
 *
 * An arriving `?init` intent rides along BY NAME. It is the email's instruction
 * to the page underneath, and the signed-out arrival is the one leg that would
 * otherwise lose it: this target builds a FRESH query, so nothing the url held
 * survives unless it is carried. Once carried the return leg is already correct
 * — `resolveToParent` spreads the route while stripping the `--session` suffix,
 * so the parent regains the page with the intent still on it.
 */
export function authOverlayTarget(
  route?: Pick<RouteLocation, "name" | "params" | "query">,
  { actor, fresh }: { actor?: ScopeActorTypes; fresh?: boolean } = {}
) {
  // Strip an overlay suffix as `resolveToParent` does: add-session is offered
  // from the GLOBAL pool, so it can be taken on the overlay itself, and
  // `<page>--session--session` is a route nobody registers and a push that throws.
  const parent = overlayParent(route);

  const named = actor ?? routeActor(route?.params);

  // Never `...route.query`: a spread would drag `fresh` and `mode` onto a target
  // that means to set them itself, re-opening the ADD-SESSION journey the `H5`
  // split exists to separate.
  const intent = get(route, ["query", QUERY_PARAMS.INIT]);
  const carried = intent
    ? { [QUERY_PARAMS.INIT]: toString(intent) }
    : undefined;

  // Annotated, so the two arms are ONE query type: an inferred union carries the
  // other arm's keys as `undefined`, which is neither a `FunnelTarget` the assign
  // accepts nor a location `router.push` takes.
  const query: LocationQuery = fresh
    ? {
        ...carried,
        [ACTOR_PARAM]: toString(authCollectActor(named)),
        [ADD_SESSION_PARAM]: Date.now().toString()
      }
    : {
        ...carried,
        ...(authNamedActor(named)
          ? { [ACTOR_PARAM]: toString(named) }
          : undefined),
        [MODE_PARAM]: AUTH_FORMS.LOGIN,
        [QUERY_PARAMS.CANCEL_URL]: ROUTE.HOME
      };

  return {
    name: `${parent}--${AUTH_OVERLAY_ID}`,
    params: route?.params,
    query
  };
}

/**
 * The pay overlay's location over the order page — the `<order>--pay` child the
 * overlay registry injects, carrying the page's params and the return query
 * (`operation_id`) so the resume hook reads the reference off the route
 * (FE-3133). It mirrors `authOverlayTarget`: the funnel re-targets here on an
 * off-site return, and the overlay opens by navigation, not imperative mount.
 */
export function payOverlayTarget(
  route?: Pick<RouteLocation, "name" | "params" | "query">
) {
  const parent = overlayParent(route);

  return {
    name: `${parent}--${PAY_OVERLAY_ID}`,
    params: route?.params,
    query: route?.query
  };
}

/**
 * The location an admitted `?init` intent opens — the `<page>--<overlay>` child
 * the overlay registry injects, carrying the page's own params and its query
 * MINUS the spent intent.
 *
 * The OMISSION is the point. `payOverlayTarget` above carries `route.query`
 * verbatim and the middleware navigates that object
 * (`app/middleware/routing.global.ts:32`), so a target built straight off the
 * route writes the param the guard has just acted on back into the url. Nothing
 * else clears it either: no clear mutates `router.currentRoute`, so this guard
 * must stay idempotent, and it is the omission that makes it so.
 *
 * Scoped to the intent's own re-target. The AUTH leg is the opposite
 * requirement and is untouched — `resolveToParent` spreads the route, so the
 * parent regains `init` after sign-in, which is what fires it there.
 */
export function intentOverlayTarget(
  route: Pick<RouteLocation, "name" | "params" | "query"> | undefined,
  overlayId: string
) {
  return {
    name: `${overlayParent(route)}--${overlayId}`,
    params: route?.params,
    query: omit(route?.query, [QUERY_PARAMS.INIT])
  };
}

/**
 * The page itself MINUS a refused or unrecognised `?init` intent. Refusing by
 * re-target, never by resolving in place, is what keeps the spent param out of
 * the url: the middleware and the engine both navigate the funnel's target, and
 * a resolve in place hands back the route that still carries it.
 */
export function intentRefusedTarget(
  route: Pick<RouteLocation, "name" | "params" | "query"> | undefined
) {
  return {
    name: route?.name,
    params: route?.params,
    query: omit(route?.query, [QUERY_PARAMS.INIT])
  };
}

/**
 * The page BENEATH the overlay, re-scoped to the actor chosen at the gate — the
 * `/as/<actor>` segment the whole playground scopes by, which is why choosing at
 * the gate is a scope change and not a second journey (`R7-1`).
 *
 * It is how GUEST proceeds at all: a guest signs into nothing, so there is no
 * session to collect, and `guardScenario` admits a url that names one. Client
 * and staff go the other way — they are `useAuth` journeys, and the overlay
 * hands them the actor directly.
 */
export function scopedPageTarget(
  route: Pick<RouteLocation, "name" | "params">,
  actor: ScopeActorTypes
) {
  return {
    name: overlayParent(route),
    params: { ...route.params, scopeSuffix: ["as", toString(actor)] }
  };
}

/**
 * Whether the overlay was opened to ADD a session — so the journey spawns a
 * fresh instance beside the live one — rather than by the guard, which collects
 * the session the page was short of (`H5` sharpened). Presence, never the
 * nonce's value.
 */
export function isAddSessionRequest(route?: Pick<RouteLocation, "query">) {
  return !!get(route, ["query", ADD_SESSION_PARAM]);
}

/**
 * The actor the overlay collects for, off the target that named it. One reader
 * for both entrances — the pool's explicit pick and the guard's own rejection
 * are the same query key.
 */
export function authRequestActor(route?: Pick<RouteLocation, "query">) {
  return get(route, ["query", ACTOR_PARAM]) as ScopeActorTypes | undefined;
}

/**
 * 🎯 EVERY SCENARIO ROUTE
 * One guarded state per registered scenario — the route name IS the state name,
 * so `is{Route}` matches it and the funnel can gate what the registry declares
 * without a hand-listed state. `guardScenario` rejects toward SESSION when the
 * scope the url names needs a session the visitor does not have; the auth modal
 * is then collected IN PLACE by re-targeting the route to `authOverlayTarget`'s
 * `--session` child, which resolves through the generated `endpoint:auth` node and
 * renders over the page.
 */
const scenarioStates = mapValues(scenarioRoutes, () => ({
  invoke: {
    // Session gate THEN `?init` intent — so a `?init=pay` deep link (or the
    // invoice page's Pay button) opens the pay overlay over the scenario, the
    // same way `[ROUTE.ORDER]` does. `guardScenarioIntent` resolves when there
    // is no intent; on an admitted intent it rejects carrying the overlay child.
    src: "guardScenarioIntent",
    onDone: { actions: ["setResolved"] },
    onError: [
      {
        target: ROUTE.SESSION_LOGIN,
        actions: [
          "setUnresolved",
          assign({
            targetRoute: ({ currentRoute }: FunnelContext) =>
              authOverlayTarget(currentRoute)
          })
        ],
        cond: "isSession"
      },
      {
        actions: [
          assign({
            targetRoute: (
              { currentRoute }: FunnelContext,
              { data }: AnyEventObject
            ) => get(data, "target") ?? currentRoute
          }),
          "setResolved"
        ]
      }
    ]
  }
}));

export default <FunnelProps>{
  id: "labs",
  states: {
    ...scenarioStates,

    /**
     * 🎯 idle (override)
     * This is the idle state of the funnel, which acts as a catch-all for unsupported routes.
     * If the current route is not one of the supported routes for this funnel,
     * and there is a meaningful target route set, it transitions to the 'complete' state
     * to allow the default funnel to take over the navigation.
     */
    idle: {
      entry: ["setResolved"]
    },

    /**
     * 🎯 ROUTE.ORDER
     * The order/invoice pay page. An off-site gateway return lands here carrying
     * `?operation_id`; `guardOrderReturn` rejects on that reference so the funnel
     * re-targets the `<order>--pay` overlay child (the auth overlay-target
     * pattern). A plain visit resolves with no redirect (FE-3133).
     *
     * `?init=pay` is one more reason the SAME guard rejects — the order page is
     * the invoice pay page, so the intent needs no state of its own. A rejection
     * that names its own target takes it; one that names none is the off-site
     * return, which the pay overlay answers.
     */
    [ROUTE.ORDER]: {
      invoke: {
        src: "guardOrderReturn",
        onDone: { actions: ["setResolved"] },
        onError: {
          actions: [
            assign({
              targetRoute: (
                { currentRoute }: FunnelContext,
                { data }: AnyEventObject
              ) => get(data, "target") ?? payOverlayTarget(currentRoute)
            }),
            "setResolved"
          ]
        }
      }
    },

    /**
     * 🎯 ROUTE.CONTRACT_PRODUCT
     * The contract-product page, and the only route `?init=upgrade` is read on.
     * Declared AFTER the `...scenarioStates` spread so it overrides the
     * generated session-only state for the same scenario — the
     * `[ROUTE.PAYMENT_DETAIL_ADD]` mechanism.
     *
     * `guardScenarioIntent` runs the scenario's own session gate FIRST and the
     * intent second, so no intent fires for a visitor the gate is about to bounce
     * to auth. The two rejections are told apart by the target each carries.
     */
    [ROUTE.CONTRACT_PRODUCT]: {
      invoke: {
        src: "guardScenarioIntent",
        onDone: { actions: ["setResolved"] },
        onError: [
          {
            target: ROUTE.SESSION_LOGIN,
            actions: [
              "setUnresolved",
              assign({
                targetRoute: ({ currentRoute }: FunnelContext) =>
                  authOverlayTarget(currentRoute)
              })
            ],
            cond: "isSession"
          },
          {
            actions: [
              assign({
                targetRoute: (
                  { targetRoute }: FunnelContext,
                  { data }: AnyEventObject
                ) => get(data, "target") ?? targetRoute
              }),
              "setResolved"
            ]
          }
        ]
      }
    },

    /**
     * 🎯 ROUTE.PAYMENT_DETAIL_ADD
     * Storing a payment method needs a client to store it against, so this page
     * is session-gated the way a scenario route is: on rejection the funnel
     * re-targets `authOverlayTarget`'s `--session` child, which collects the
     * session in the auth modal over this page rather than navigating away.
     */
    [ROUTE.PAYMENT_DETAIL_ADD]: {
      invoke: {
        src: "guardAuthenticated",
        onDone: { actions: ["setResolved"] },
        onError: [
          {
            target: ROUTE.SESSION_LOGIN,
            actions: [
              "setUnresolved",
              assign({
                targetRoute: ({ currentRoute }: FunnelContext) =>
                  authOverlayTarget(currentRoute)
              })
            ],
            cond: "isSession"
          },
          { actions: ["setResolved"] }
        ]
      }
    },

    /**
     * 🎯 ROUTE.SESSION
     * This state serves as a routing hub for session-related actions.
     * It always transitions to the SESSION_REGISTER route to handle user registration as the default action.
     */
    [ROUTE.SESSION]: {
      invoke: {
        src: "guardSession",
        onDone: {
          actions: ["setResolved"]
        },
        onError: {
          target: ROUTE.SESSION_REGISTER,
          actions: ["setResolving"]
        }
        // BRAND SETTING TO DECIDE DEFAULT SESSION ROUTE
      }
    },

    /**
     * 🎯 ROUTE.SESSION_LOGIN
     * This state manages the login process for user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * If the user is authenticated, it redirects to the BASKET route.
     * From here, users can proceed to the CHECKOUT route or return to the BASKET.
     */
    [ROUTE.SESSION_LOGIN]: {
      invoke: {
        src: "guardSession",
        onDone: {
          actions: ["setResolved"]
        },
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_LOGIN,
          actions: ["setResolving", "setTargetRoute"]
        },
        BACK: { actions: ["setResolving", "setTargetRoute"] }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_REGISTER
     * This state manages the registration process for new user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * If the user is authenticated, it redirects to the BASKET route.
     * From here, users can proceed to the CHECKOUT route or return to the BASKET.
     */
    [ROUTE.SESSION_REGISTER]: {
      invoke: {
        src: "guardSession",
        onDone: {
          actions: ["setResolved"]
        },
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_REGISTER,
          actions: ["setResolving", "setTargetRoute"]
        },
        BACK: { actions: ["setResolving", "setTargetRoute"] }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_RECOVER_PASSWORD
     * This state manages the password recovery process for user sessions.
     */
    [ROUTE.SESSION_RECOVER_PASSWORD]: {
      invoke: {
        src: "guardSession",
        onDone: {
          actions: ["setResolved"]
        },
        onError: [{ actions: ["setResolved"] }]
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_RECOVER_PASSWORD,
          actions: ["setResolving", "setTargetRoute"]
        },
        BACK: { actions: ["setResolving", "setTargetRoute"] }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_END
     * This state manages the logout process for user sessions.
     */
    [ROUTE.SESSION_END]: {
      entry: ["setResolved"],
      invoke: {
        src: "guardSession",
        onDone: { actions: ["logout"] },
        onError: { actions: [] }
      },
      on: {
        NEXT: {
          actions: [assign({ targetRoute: { name: ROUTE.HOME } })]
        },
        BACK: { actions: [assign({ targetRoute: { name: ROUTE.HOME } })] }
      }
    }
  },
  guards,
  services,
  actions
};
