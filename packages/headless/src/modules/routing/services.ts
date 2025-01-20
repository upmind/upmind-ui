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

async function matchFlow(routes: Flow[], route: Route): Promise<Flow> {
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

async function guardFlow(flow: Flow, route: Route): Promise<boolean> {
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
  context: RoutingEngineContext,
  { data }: AnyEventObject
) {
  const route = data as Route;
  const currentFlow = get(
    context,
    "currentFlow",
    find(context.flows, ["name", data?.name])
  );
  return matchFlow(currentFlow?.targets?.next || [], route).then(flow => {
    return resolve(context, {
      type: "RESOLVE",
      data: {
        flow,
        route,
      },
    });
  });
}

async function calculateBackRoute(
  context: RoutingEngineContext,
  { data }: AnyEventObject
) {
  const route = data as Route;
  const currentFlow = get(
    context,
    "currentFlow",
    find(context.flows, ["name", data?.name])
  );
  return matchFlow(currentFlow?.targets?.back || [], route).then(flow => {
    return resolve(context, {
      type: "RESOLVE",
      data: {
        flow,
        route,
      },
    });
  });
}

async function resolve(
  { currentFlow, basketHelper, flows }: RoutingEngineContext,
  { data }: AnyEventObject
) {
  // ---
  const route = data.route as Route;
  const name = data.name as ROUTE;
  const flow = data?.flow as Flow;
  const target = flow || find(flows, ["name", name]) || currentFlow;

  if (!target) return Promise.reject();

  const resolvedFlow = await guardFlow(target, route).then(async valid => {
    // if we have a valid target, then we can resolve the route,
    // otherwise we need to check if we have a fallback
    // if we dont have a fallback, then we need to check if we have any items in the basket, as it may be empty

    const flow: Flow | undefined = valid
      ? target
      : await matchFlow(target?.targets?.fallback || [], route).catch(() => {
          const basket = basketHelper?.getSnapshot();
          if (isEmpty(basket?.context?.products)) {
            return find(flows, ["name", ROUTE.EMPTY]);
          }

          // if we get to this point and we still dont have a target, then we need to bail
          return undefined;
        });

    return flow;
  });

  const resolvedRoute = resolvedFlow
    ? await resolveRoute(resolvedFlow, route)
    : undefined;

  return new Promise((resolve, reject) => {
    if (resolvedRoute) {
      resolve({ flow: resolvedFlow, route: resolvedRoute });
    } else {
      reject({ name, target });
    }
  });
}

async function resolveRoute(flow: Flow, route: Route): Promise<Route> {
  return isFunction(flow?.resolve)
    ? flow.resolve(route)
    : Promise.resolve({ name: flow.name });
}

// --------------------------------------------------------
// EXPORTS

export default {
  calculateNextRoute,
  calculateBackRoute,
  resolve,
} as any;
