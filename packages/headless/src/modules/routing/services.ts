// --- external

import type { AnyEventObject } from "xstate";
import { ROUTE } from "./types";
import type { RoutingEngineContext, Flow } from "./types";

// --- internal

// --- utils
import { find, findIndex, isEmpty, map, get } from "lodash-es";
import { isFunction } from "xstate/lib/utils";

// --- types
import type { Route } from "./types";

// --- Helper functios/utils

async function matchFlow(routes: Flow[], route: Route) {
  if (isEmpty(routes)) return Promise.reject();
  // NB cant use odash her as we are async
  const guards = map(routes, flow => guardFlow(flow, route));
  const match = await Promise.all(guards)
    .then(responses => {
      const match = findIndex(responses, response => response === true);
      return get(routes, match);
    })
    .catch(() => {
      return undefined;
    });

  return new Promise((resolve, reject) => (match ? resolve(match) : reject()));
}

async function guardFlow(flow: Flow, route: Route) {
  let valid = true;
  if (isFunction(flow.guard)) {
    valid = await flow.guard(route);
  }
  return valid;
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise
// ---

async function calculateNextRoute(
  { currentFlow }: RoutingEngineContext,
  { data }: AnyEventObject
) {
  const route = data as Route;
  return matchFlow(currentFlow?.targets?.next || [], route);
}

async function calculateBackRoute(
  { currentFlow }: RoutingEngineContext,
  { data }: AnyEventObject
) {
  const route = data as Route;
  return matchFlow(currentFlow?.targets?.back || [], route);
}

async function resolve(
  { currentFlow, basketHelper, flows }: RoutingEngineContext,
  { data }: AnyEventObject
) {
  // ---
  const route = data.route as Route;
  const name = data.name as ROUTE;
  const target = find(flows, ["name", name]) || currentFlow;

  if (!target) return Promise.reject();
  return guardFlow(target, route).then(value => {
    if (value) return target;
    // if we still dont have a target, then we need to check if we have any fallbacks for out current route
    return matchFlow(target?.targets?.fallback || [], route).catch(() => {
      // if we still dont have a target, then we need to check if we have any items in the basket, as it may be empty
      const basket = basketHelper?.getSnapshot();
      if (isEmpty(basket?.context?.products)) {
        return find(flows, ["name", ROUTE.EMPTY]);
      }

      // if we get to this point and we still dont have a target, then we need to check if we have a fallback
      return Promise.reject();
    });
  });
}

// --------------------------------------------------------
// EXPORTS

export default {
  calculateNextRoute,
  calculateBackRoute,
  resolve,
} as any;
