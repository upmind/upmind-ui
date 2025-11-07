// --- internal
import { Flow, Route } from "@upmind-automation/client-vue";

// --- utils

// --- types
import { ROUTE } from "./types";

// -----------------------------------------------------------------------------

export const useCustomFlows = () => {
  return [
    {
      name: ROUTE.ACCOUNT_PROFILE,
      guard: async (route: Route) => {
        return true; // COULD add auth checks here
      },
      targets: {
        next: [],
        back: [],
        fallback: [ROUTE.SESSION_LOGIN]
      }
    }
  ] as Flow[];
};
