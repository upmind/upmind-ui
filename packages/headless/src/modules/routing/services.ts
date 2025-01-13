// --- external

import type { AnyEventObject } from "xstate";
import { ROUTE } from "./types";
import type { RoutingEngineContext, Flow } from "./types";

// --- internal

// --- utils
import { find, isEmpty } from "lodash-es";
import { isFunction } from "xstate/lib/utils";

// --- types

// --- Helper functios/utils

async function matchRoute(routes: Flow[]) {
  debugger;
  if (isEmpty(routes)) return Promise.reject();
  debugger;
  // NB cant use odash her as we are async
  routes.forEach(async target => {
    debugger;
    const valid = await guardRoute(target);
    debugger;
    if (valid) return Promise.resolve(target);
  });

  //  if we dont have any matches, then we  need to remail the current route
  return Promise.reject();
}

async function guardRoute(route: Flow) {
  if (isFunction(route.guard)) {
    const valid = await route.guard();
    if (valid) return true;
  } else {
    return true;
  }

  return false;
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise
// ---

async function calculateNextRoute(
  { currentFlow, flows }: RoutingEngineContext,
  _event: AnyEventObject
) {
  debugger;
  console.log(flows, currentFlow);
  return matchRoute(currentFlow?.targets?.next || []);
}

async function calculateBackRoute(
  { currentFlow }: RoutingEngineContext,
  _event: AnyEventObject
) {
  return matchRoute(currentFlow?.targets?.back || []);
}

async function handleRoute(
  { currentFlow, basketHelper, flows }: RoutingEngineContext,
  { data }: AnyEventObject
) {
  // ---
  debugger;
  const target = find(flows, ["id", data]) || currentFlow;
  debugger;
  if (!target) return Promise.reject();
  debugger;
  return guardRoute(target)
    .then(() => target)
    .catch(() => {
      // if we still dont have a target, then we need to check if we have any fallbacks for out current route
      return matchRoute(currentFlow?.targets?.fallback || []).catch(() => {
        // if we still dont have a target, then we need to check if we have any items in the basket, as it may be empty
        const basket = basketHelper?.getSnapshot();
        if (isEmpty(basket?.context?.products))
          return find(flows, ["id", ROUTE.EMPTY]);

        //   if we get to this point and we still dont have a target, then we need to check if we have a fallback
        return Promise.reject();
      });
    });
}

// --------------------------------------------------------
// EXPORTS

export default {
  calculateNextRoute,
  calculateBackRoute,
  handleRoute,
} as any;
