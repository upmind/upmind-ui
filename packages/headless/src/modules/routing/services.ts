// --- external

// --- internal
import { useI18n } from "../system";

// --- utils
import {
  compact,
  find,
  findIndex,
  get,
  isEmpty,
  isFunction,
  isObject,
  map,
  merge,
  set
} from "lodash-es";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { Flow, Route, ROUTE, RoutingEngineContext, Target } from "./types";
import { useBrand } from "../brand";
import { UI, UIRouteOptions } from "../brand/types";

// -----------------------------------------------------------------------------

async function matchTargets(
  targets: Flow[],
  route: Route,
  event?: any
): Promise<Flow> {
  const { t } = useI18n();

  if (isEmpty(targets))
    return Promise.reject(
      new DetailedError(
        t("error.routing_targets_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );
  // NB cant use lodash her as we are async
  const guards = map(targets, flow => guardTarget(flow, route, event));
  const match = await Promise.all(guards)
    .then(responses => {
      const match = findIndex(responses, response => response === true);
      return get(targets, match);
    })
    .catch(errors => {
      return undefined;
    });

  return new Promise((resolve, reject) => (match ? resolve(match) : reject()));
}

async function guardTarget(
  target: Flow,
  route: Route,
  event?: any
): Promise<boolean> {
  let valid = true;
  if (isFunction(target.guard)) {
    valid = await target.guard(route, event);
  }
  return valid;
}

function mapTargets(targets: Target[], flows: Flow[]): Flow[] {
  return compact(
    map(targets, target => {
      return isObject(target) ? target : find(flows, ["name", target]);
    })
  );
}

async function calculateNextRoute(
  { flows }: RoutingEngineContext,
  { data }: AnyEventObject
) {
  const route = data.route as Route;
  const event = data.event as any;

  // get the current flow based on the passed route
  const currentFlow = find(flows, ["name", route?.name]);

  const targets = mapTargets(currentFlow?.targets?.next || [], flows);

  if (isEmpty(targets)) return Promise.reject();

  return matchTargets(targets, route, event).then(flow => {
    return resolve(
      {
        flows,
        currentFlow
      },
      {
        type: "RESOLVE",
        data: {
          flow,
          route,
          event
        }
      }
    );
  });
}

async function calculateBackRoute(
  { flows }: RoutingEngineContext,
  { data }: AnyEventObject
) {
  const route = data.route as Route;
  const event = data.event as any;

  // get the current flow based on the passed route
  const currentFlow = find(flows, ["name", route?.name]);

  const targets = mapTargets(currentFlow?.targets?.back || [], flows);

  if (isEmpty(targets)) return Promise.reject();

  return matchTargets(targets, route, event).then(flow => {
    return resolve(
      {
        flows,
        currentFlow
      },
      {
        type: "RESOLVE",
        data: {
          flow,
          route,
          event
        }
      }
    );
  });
}

async function resolve(
  { currentFlow, flows }: RoutingEngineContext,
  { data }: AnyEventObject
) {
  // ---
  const route = data.route as Route;

  const name = data.name as ROUTE;

  const flow = data?.flow as Flow;

  const event = data?.event;

  const target = flow || find(flows, ["name", name]) || currentFlow;

  if (!target) return Promise.reject();

  const resolvedFlow = await guardTarget(target, route, event).then(
    async valid => {
      // if we have a valid target, then we can resolve the route,
      // otherwise we need to check if we have a fallback
      // if we dont have a fallback, then we need to check if we have any items in the basket, as it may be empty

      const targets = mapTargets(target?.targets?.fallback || [], flows);
      const flow: Flow | undefined = valid
        ? target
        : await matchTargets(targets, route, event).catch(() => undefined);

      return flow;
    }
  );

  const resolvedRoute = resolvedFlow
    ? await resolveRoute(resolvedFlow, route, event)
    : undefined;

  return new Promise((resolve, reject) => {
    if (resolvedRoute) {
      resolve({ flow: resolvedFlow, route: resolvedRoute });
    } else {
      reject({ name, target });
    }
  });
}

/**
 * Resolves the route for a given flow.
 * The route param is the ORIGINATING route used to determine the flow,
 * NOT the destination route.
 * @param flow
 * @param route
 * @param event
 * @returns
 */
async function resolveRoute(
  flow: Flow,
  route: Route,
  event?: any
): Promise<Route> {
  const { uischema_Route, uiCart, isReady } = useBrand();
  await isReady();

  const fallbackTemplate = get(uiCart.value, "layout");
  const uischema = get(uischema_Route?.value, flow.name, {}) as UIRouteOptions;

  if (isFunction(flow?.resolve))
    return flow.resolve(route, event).then(resolved => ({
      ...resolved,
      meta: merge(
        {},
        flow?.meta,
        uischema,
        { template: uischema?.template || fallbackTemplate },
        resolved?.meta
      )
    }));

  // if we dont have a resolve function then, just merge in any meta changes
  return {
    name: flow.name,
    meta: merge({}, flow?.meta, uischema, {
      template: uischema?.template || fallbackTemplate
    })
  };
}

// -----------------------------------------------------------------------------

export default {
  calculateNextRoute,
  calculateBackRoute,
  resolve
};
