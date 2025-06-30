// --- external

// --- internal
import { useSession } from "../../session";
import { useRouteQueryParams, useRoutingEngine } from "..";
import { useBasketProductsPending } from "../../basketProduct";

// --- utils
import { uniqBy, isEmpty } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";
import { SessionContext } from "../../session/types";

// -----------------------------------------------------------------------------

function isExternalURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.host !== window.location.host;
  } catch (e) {
    return false;
  }
}
function parseInternalUrl(path: string): string {
  try {
    const url = new URL(path, window.location.origin);
    return url.href;
  } catch (e) {
    return path;
  }
}

export const useSessionFlows = () => {
  const routing = useRoutingEngine();
  const {
    isAuthenticated,
    transferFrom,
    getTransferDetails,
    transferred,
    logout
  } = useSession();
  const { clear: clearPendingProducts } = useBasketProductsPending();

  let flows: Flow[] = [
    {
      name: ROUTE.SESSION,
      guard: async (_route: Route) => {
        const valid = await isAuthenticated()
          .then(valid => !valid)
          .catch(() => true);
        return valid;
      },
      targets: {
        next: [ROUTE.CHECKOUT, ROUTE.BASKET, ROUTE.EMPTY],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY]
      }
    },
    {
      name: ROUTE.SESSION_LOGIN,
      guard: async (_route: Route) => {
        const valid = await isAuthenticated()
          .then(() => false)
          .catch(() => true);
        return valid;
      },
      targets: {
        next: [ROUTE.CHECKOUT, ROUTE.BASKET, ROUTE.EMPTY],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY]
      }
    },
    {
      name: ROUTE.SESSION_REGISTER,
      guard: async (_route: Route) => {
        const valid = await isAuthenticated()
          .then(() => false)
          .catch(() => true);
        return valid;
      },
      targets: {
        next: [ROUTE.CHECKOUT, ROUTE.BASKET, ROUTE.EMPTY],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY]
      }
    },
    {
      name: ROUTE.SESSION_END,
      guard: async (route: Route) => {
        logout();
        clearPendingProducts();
        return true;
      },
      targets: {
        next: [],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY]
      }
    },
    {
      name: ROUTE.SESSION_TRANSFER,
      meta: {
        replace: true
      },
      guard: async (route: Route) => {
        const query = useRouteQueryParams(route);
        const code = query.getParam("code");
        const redirect = query.getParam("redirect");
        const transfer: SessionContext["transfer"] = await transferFrom(
          code,
          redirect
        );
        return !isEmpty(transfer?.redirect);
      },
      resolve: async (_route: Route) => {
        const transfer = getTransferDetails();

        let route: Route = {
          name: ROUTE.BASKET
        };

        // NB: WE always use location.href to redirect to ensure routes and query params are interpreted correctly
        // this also forces a full page reload and resets the app state
        // this is particularly important if we redirect with query params, like adding a product to the basket
        if (transfer?.redirect) {
          if (isExternalURL(transfer?.redirect)) {
            window.location.href = transfer.redirect;
            route = {
              name: ROUTE.SESSION_TRANSFER
            };
          } else {
            window.location.href = parseInternalUrl(transfer.redirect);
            route = {
              name: ROUTE.SESSION_TRANSFER
            };
          }
        }

        transferred();
        return route;
      },
      targets: {
        next: [ROUTE.BASKET],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY]
      }
    },
    {
      name: ROUTE.SESSION_RECOVER_PASSWORD,
      guard: async (_route: Route) =>
        await isAuthenticated()
          .then(() => false)
          .catch(() => true),
      targets: {
        next: [ROUTE.SESSION_LOGIN],
        back: [ROUTE.SESSION_LOGIN],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY]
      }
    }

    // {
    //   name: ROUTE.PROFILE,
    //   guard: async (_route: Route) =>await isAuthenticated()
    // .then(() => true)
    // .catch(() => false)
    //   targets: {
    //     next: [{ name: ROUTE.CHECKOUT }],
    //     back: [{ name: ROUTE.BASKET }],
    //     fallback: [{ name: ROUTE.BASKET }],
    //   },
    // },
  ];

  return {
    getFlows: () => flows,
    register: (data?: Flow[]) => {
      flows = uniqBy([...(data ?? []), ...flows], "name");
      routing.register(flows);
    }
  };
};
