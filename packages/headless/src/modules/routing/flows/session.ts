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
  const { isAuthenticated } = useSession();

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
        next: [{ name: ROUTE.CHECKOUT }],
        back: [{ name: ROUTE.BASKET }],
        fallback: [{ name: ROUTE.BASKET }],
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
    //   // handler: (router: any) => {
    //   //   router.push(`/product/recommendations`);
    //   // },
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
    //   // handler: (router: any) => {
    //   //   router.push(`/product/recommendations`);
    //   // },
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
