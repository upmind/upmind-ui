import { isEmpty } from "lodash-es";

import {
  assign,
  type FunnelContext,
  useBasket,
  useBasketProductsPending,
  useQueryParams,
  useSession
} from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

/**
 * Actions to perform specific tasks during state transitions.
 * These actions cannot be asynchronous.
 * @param context
 * @returns  void
 */
export default {
  setCurrency: ({ currentRoute }: FunnelContext) => {
    const { setCurrency } = useBasket();
    const { currency } = useQueryParams(currentRoute);
    if (currency) setCurrency(currency);
  },

  setProductConfigs: ({ currentRoute }: FunnelContext) => {
    const { addMany } = useBasketProductsPending();
    const { productConfigs } = useQueryParams(currentRoute);
    if (!isEmpty(productConfigs)) addMany(productConfigs);
  },

  forceAutoupdate: assign({
    currentRoute: ({ currentRoute }: FunnelContext) => {
      if (!currentRoute) return;
      const { getParam } = useQueryParams(currentRoute);
      const autoupdate = getParam("autoupdate", true);
      currentRoute.query.autoupdate = autoupdate ? "true" : "false";
      return currentRoute;
    }
  }),

  // Force end the session by logging out the user
  logout: () => {
    const { logout } = useSession();
    logout();
  }
};
