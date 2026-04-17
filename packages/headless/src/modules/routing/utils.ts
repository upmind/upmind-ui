// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useI18n } from "../system";
import { useBasket } from "../basket";
import { useBasketProductsPending } from "../basketProduct";

// --- utils
import {
  contextValue,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches
} from "../../utils";
import {
  camelCase,
  defaultsDeep,
  find,
  first,
  get,
  includes,
  isEmpty,
  isEqual,
  reject,
  some,
  upperFirst,
  values
} from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { BasketProduct } from "../basketProduct";
import { REQUIRES_ACTION } from "./types";
import { type RouteLocation, type RouteRecordRaw } from "vue-router";
import { useBrand } from "../brand";
import { type UIRouteOptions } from "../brand/types";

// -----------------------------------------------------------------------------

/**
 * Awaits until the provided service reaches a specific state and resolves with the current route from the state context.
 */
export async function awaitResolved(
  service?: ActorRef<any>
): Promise<RouteLocation> {
  const { t } = useI18n();
  if (!service)
    throw new DetailedError(
      t("error.route_resolve_failed"),
      responseCodes.Timeout,
      ErrorOrigin.Headless
    );

  return waitFor(
    service,
    state => {
      const isResolved = !!contextValue<boolean>(state, "resolved");
      const isAvailable = stateMatches(state, ["available"]);
      const isComplete = stateMatches(state, ["error", "done", "complete"]);
      return isComplete || (isAvailable && isResolved);
    },
    { timeout: 60_000 }
  )
    .then(state => {
      const target = defaultsDeep(state.context.targetRoute, {
        name: state.value.available,
        params: {},
        query: {},
        hash: "",
        meta: {}
      });

      // console.debug("Route resolves", target, { state });

      return target;
    })
    .catch(() => {
      // console.debug("Route did not resolve", service.getSnapshot().context);
      return undefined; //contextValue<RouteLocation>(service, "currentRoute");
    });
}

/**
 * Ensures the route path ends with a trailing slash.
 * Returns a redirect location if a trailing slash needs to be appended,
 * or undefined if the path already has one.
 * @param route - The current route location to check
 */
export function ensureTrailingSlash(
  route: RouteLocation
): { path: string; query: RouteLocation["query"]; hash: string } | undefined {
  if (!route?.path || route.path === "/" || route.path.endsWith("/")) {
    return undefined;
  }

  return {
    path: `${route.path}/`,
    query: route.query,
    hash: route.hash
  };
}

/**
 * Determine if the route has meaningfully changed compared to a target object
 * We only check keys present in the target object to avoid unnecessary comparisons.
 * @param route
 * @param target
 * @returns
 */
export function hasRouteChanged(
  route: RouteLocation,
  target: Record<string, any>,
  {
    guardName,
    guardParams,
    guardQuery
  }: {
    guardName?: boolean;
    guardParams?: boolean;
    guardQuery?: boolean;
  } = {
    guardName: true,
    guardParams: true,
    guardQuery: true
  }
): boolean {
  if (!target) return false;

  const changedName = !!guardName && !isEqual(route?.name, target?.name);

  // Only compare keys present in target params
  const changedParams =
    !!guardParams &&
    some(
      target?.params,
      (value, key) => !isEqual(get(route?.params, key), value)
    );

  // FE-2651: Only compare keys present in target query — avoids spurious
  // redirects from defaultsDeep filling query: {} in awaitResolved.
  const changedQuery =
    !!guardQuery &&
    some(
      target?.query,
      (value, key) => !isEqual(get(route?.query, key), value)
    );

  // console.debug("Route Change Detection:", {
  //   route,
  //   target,
  //   changedName,
  //   changedParams,
  //   changedQuery
  // });
  // Only compare keys present in target query
  // const changedQuery = some(
  //   target?.query,
  //   (value, key) => !isEqual(get(route?.query, key), value)
  // );

  return changedName || changedParams || changedQuery;
}

/**
 * Decorate all route records with brand specific UIschema or layout information
 * This modifies the route definitions (records) rather than the navigation location,
 * which avoids Vue Router warnings about mutating route.meta during navigation.
 */
export async function decorateRoutes(routes: RouteRecordRaw[]) {
  const { uischema_Route, uiCart, isReady } = useBrand();
  await isReady();

  const fallbackTemplate = get(uiCart.value, "layout");

  // Loop through all registered routes and update their meta
  routes.forEach(routeRecord => {
    const uischema = routeRecord.name
      ? (get(uischema_Route?.value, routeRecord.name, {}) as UIRouteOptions)
      : {};

    // Mutate the route RECORD's meta (this is allowed, unlike RouteLocation.meta)
    routeRecord.meta = {
      ...(routeRecord?.meta ?? {}),
      ...uischema,
      template: uischema?.template || fallbackTemplate
    };
  });
}
/**
 * Provides utilities to determine if any basket products require user action,
 * such as completing pending actions, fixing invalid products, or addressing related items.
 */
export const useRouteRequiresAction = () => {
  const { getProducts, getInvalidProducts, isReady } = useBasket();
  const { get: getPendingProducts, meta } = useBasketProductsPending();

  function getNextPending(current?: ActorRef<any>) {
    const productsPending = reject(getPendingProducts(), ["id", current?.id]);
    return first(productsPending);
  }

  function getNextInvalid(current?: ActorRef<any>) {
    const pid = get(current, "state.context.model.productId", {});
    const products = reject(getInvalidProducts(), ["productId", pid]);
    const basketProduct = first(products);
    return basketProduct;
  }

  function getNextRelated(current: ActorRef<any>): undefined | BasketProduct {
    // Related items ar when the current items provision fields
    // contain the service identifier of another basket item
    const provisionFields = contextValue<Record<string, any>>(
      current,
      "model.provisionFields"
    );

    if (isEmpty(provisionFields)) return;

    const basketProduct = find(getProducts(), basketProduct => {
      const serviceIdentifier = get(basketProduct, "serviceIdentifier");
      if (!serviceIdentifier) return false;
      const value = includes(values(provisionFields), serviceIdentifier);
      const hasError = !isEmpty(get(basketProduct, "errors"));
      return value && hasError;
    });

    return basketProduct;
  }

  function getNext(
    currentBasketItem?: ActorRef<any>,
    types: REQUIRES_ACTION[] = [
      REQUIRES_ACTION.PENDING,
      REQUIRES_ACTION.INVALID,
      REQUIRES_ACTION.RELATED
    ]
  ) {
    // if we are passed a current item we want to check for any related items
    // and  if they are pending or invalid we want to navigate to them
    // otherwise check for any pending or invalid items
    return (
      (includes(types, REQUIRES_ACTION.RELATED) &&
        currentBasketItem &&
        getNextRelated(currentBasketItem)) ||
      (includes(types, REQUIRES_ACTION.PENDING) &&
        getNextPending(currentBasketItem)) ||
      (includes(types, REQUIRES_ACTION.INVALID) &&
        getNextInvalid(currentBasketItem)) ||
      null
    );
  }

  return {
    isReady,
    meta,
    getNext,
    getNextPending,
    getNextInvalid,
    getNextRelated,
    getProducts: () => getInvalidProducts(),
    hasProducts: () => !isEmpty(getInvalidProducts())
  };
};

export function pascalCase(str: string): string {
  return upperFirst(camelCase(str));
}
