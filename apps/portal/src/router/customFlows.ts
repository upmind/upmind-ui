// --- internal
import { Flow, Route, useSession } from "@upmind-automation/client-vue";

// --- utils

// --- types
import { ROUTE } from "./types";

// -----------------------------------------------------------------------------

export const useCustomFlows = () => {
  return [
    {
      name: ROUTE.ACCOUNT_PROFILE,
      guard: async (route: Route) => {
        // const { isReady, meta } = useSession();
        // await isReady();
        // return meta.value.isAuthenticated;
        return true;
      },
      targets: {
        next: [],
        back: [],
        fallback: [ROUTE.SESSION_LOGIN]
      }
    },
    {
      name: ROUTE.BILLING_DETAILS,
      guard: async (route: Route) => {
        // const { isReady, meta } = useSession();
        // await isReady();
        // return meta.value.isAuthenticated;
        return true;
      },
      targets: {
        next: [],
        back: [],
        fallback: [ROUTE.SESSION_LOGIN]
      }
    },
    {
      name: ROUTE.ACCOUNT_PROFILE_EDIT,
      guard: async (route: Route) => {
        // const { isReady, meta } = useSession();
        // await isReady();
        // return meta.value.isAuthenticated;
        return true;
      },
      targets: {
        next: [],
        back: [],
        fallback: [ROUTE.SESSION_LOGIN]
      }
    }
  ] as Flow[];
};
