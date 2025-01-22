// --- external

// --- internal
import { useSession } from "../../session";
import { useRoutingEngine } from "..";
// --- utils
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------
export const useSessionFlows = () => {
  const routing = useRoutingEngine();
  const { service, isAuthenticated, reset } = useSession();

  service.onTransition((state, event) => {
    // this type indicates the session has ended
    if (event.type === "done.invoke.clientMachine") {
      reset();
    }
  });

  let flows: Flow[] = [
    {
      name: ROUTE.SESSION,
      guard: async (_route: Route) => {
        const valid = await isAuthenticated()
          .then(() => false)
          .catch(() => true);
        return valid;
      },
      targets: {
        next: [ROUTE.CHECKOUT, ROUTE.BASKET],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY],
      },
    },
    {
      name: ROUTE.SESSION_END,
      guard: async (_route: Route) => {
        const valid = await isAuthenticated()
          .then(() => false)
          .catch(() => true);
        return valid;
      },
      resolve: async () => {
        // @ts-ignore
        const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;
        return storefrontUrl ?? "/"; //redirect to storefront OR the app root as fallback
      },
    },
    // {
    //   name: ROUTE.SESSION_LOGIN,
    //   guard: async (_route: Route) => {

    //     const valid = await isAuthenticated()
    //       .then(() => false)
    //       .catch(() => true);

    //     return valid;
    //   },
    //   targets: {
    //     next: [{ name: ROUTE.CHECKOUT }],
    //     back: [{ name: ROUTE.BASKET }],
    //     fallback: [{ name: ROUTE.BASKET }],
    //   },
    // },
    // {
    //   name: ROUTE.SESSION_REGISTER,
    //   guard: async (_route: Route) => {

    //     const valid = await isAuthenticated()
    //       .then(() => false)
    //       .catch(() => true);

    //     return valid;
    //   },
    //   targets: {
    //     next: [{ name: ROUTE.CHECKOUT }],
    //     back: [{ name: ROUTE.BASKET }],
    //     fallback: [{ name: ROUTE.BASKET }],
    //   },
    // },
    // {
    //   name: ROUTE.SESSION_FORGOT_PASSWORD,
    //  guard: async (_route: Route) => await  isAuthenticated()
    // .then(() => false)
    // .catch(() => true),
    //   targets: {
    //     next: [{ name: ROUTE.CHECKOUT }],
    //     back: [{ name: ROUTE.BASKET }],
    //     fallback: [{ name: ROUTE.BASKET }],
    //   },
    // },
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
    },
  };
};
