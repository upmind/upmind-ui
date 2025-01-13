// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";
// --- utils
import { uniqBy } from "lodash-es";

// --- types
import type { Flow } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------
export const useSessionFlows = () => {
  const routing = useRoutingEngine();
  const { hasProducts, needsAuth } = useBasket();

  let flows: Flow[] = [
    {
      id: ROUTE.LOGIN,
      name: "login",
      path: "/session/login",
      // handler: (router: any) => {
      //   router.push(`/product/recommendations`);
      // },
      guard: async () => {
        const valid = hasProducts() && !needsAuth();
        return valid;
      },
      targets: {
        next: [{ id: ROUTE.CHECKOUT }],
        back: [{ id: ROUTE.BASKET }],
        fallback: [{ id: ROUTE.BASKET }],
      },
    },
    {
      id: ROUTE.REGISTER,
      name: "register",
      path: "/session/register",
      // handler: (router: any) => {
      //   router.push(`/product/recommendations`);
      // },
      guard: async () => {
        const valid = hasProducts() && !needsAuth();
        return valid;
      },
      targets: {
        next: [{ id: ROUTE.CHECKOUT }],
        back: [{ id: ROUTE.BASKET }],
        fallback: [{ id: ROUTE.BASKET }],
      },
    },
    // {
    //   id: ROUTE.FORGOT_PASSWORD,
    //   name: "register",
    //   path: "/session/forgot",
    //   // handler: (router: any) => {
    //   //   router.push(`/product/recommendations`);
    //   // },
    //   guard: async () => {
    //     const valid = hasProducts() && !needsAuth();
    //     return valid;
    //   },
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
    //   guard: async () => {
    //     const valid = hasProducts() && !needsAuth();
    //     return valid;
    //   },
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
