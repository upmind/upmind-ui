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
      id: ROUTE.SESSION,
      name: "auth",
      path: "/auth",
      guard: async (_route: Route) => {
        debugger;
        const valid = await isAuthenticated()
          .then(() => false)
          .catch(() => true);
        debugger;
        return valid;
      },
      targets: {
        next: [{ id: ROUTE.CHECKOUT }],
        back: [{ id: ROUTE.BASKET }],
        fallback: [{ id: ROUTE.BASKET }],
      },
    },
    // {
    //   id: ROUTE.SESSION_LOGIN,
    //   name: "login",
    //   path: "/session/login",
    //   guard: async (_route: Route) => {
    //     debugger;

    //     const valid = await isAuthenticated()
    //       .then(() => false)
    //       .catch(() => true);
    //     debugger;
    //     return valid;
    //   },
    //   targets: {
    //     next: [{ id: ROUTE.CHECKOUT }],
    //     back: [{ id: ROUTE.BASKET }],
    //     fallback: [{ id: ROUTE.BASKET }],
    //   },
    // },
    // {
    //   id: ROUTE.SESSION_REGISTER,
    //   name: "register",
    //   path: "/session/register",
    //   guard: async (_route: Route) => {
    //     debugger;

    //     const valid = await isAuthenticated()
    //       .then(() => false)
    //       .catch(() => true);
    //     debugger;
    //     return valid;
    //   },
    //   targets: {
    //     next: [{ id: ROUTE.CHECKOUT }],
    //     back: [{ id: ROUTE.BASKET }],
    //     fallback: [{ id: ROUTE.BASKET }],
    //   },
    // },
    // {
    //   id: ROUTE.SESSION_FORGOT_PASSWORD,
    //   name: "register",
    //   path: "/session/forgot",
    //   // handler: (router: any) => {
    //   //   router.push(`/product/recommendations`);
    //   // },
    //  guard: async (_route: Route) => await  isAuthenticated()
    // .then(() => false)
    // .catch(() => true),
    //   targets: {
    //     next: [{ id: ROUTE.CHECKOUT }],
    //     back: [{ id: ROUTE.BASKET }],
    //     fallback: [{ id: ROUTE.BASKET }],
    //   },
    // },
    // {
    //   id: ROUTE.PROFILE,
    //   name: "profile",
    //   path: "/session/profile",
    //   // handler: (router: any) => {
    //   //   router.push(`/product/recommendations`);
    //   // },
    //   guard: async (_route: Route) =>await isAuthenticated()
    // .then(() => true)
    // .catch(() => false)
    //   targets: {
    //     next: [{ id: ROUTE.CHECKOUT }],
    //     back: [{ id: ROUTE.BASKET }],
    //     fallback: [{ id: ROUTE.BASKET }],
    //   },
    // },
  ];

  return {
    getFlows: () => flows,
    register: (data?: Flow[]) => {
      flows = uniqBy([...(data ?? []), ...flows], "id");
      routing.register(flows);
    },
  };
};
