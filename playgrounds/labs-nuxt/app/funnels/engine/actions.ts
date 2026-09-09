import {
  useActiveSession,
  useBasket,
  useQueryParams
} from "@upmind-automation/client-vue";
import type { FunnelContext } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------
/**
 * Actions to perform specific tasks during state transitions.
 * These actions cannot be asynchronous.
 * @param context
 * @returns  void
 */
export default {
  // `?currency=` on route entry, forwarded to the currency machine. The login
  // state declares this action; without it xstate warned on every visit and the
  // param was silently dropped.
  setCurrency: ({ currentRoute }: FunnelContext) => {
    const { setCurrency } = useBasket();
    const { currency } = useQueryParams(currentRoute);
    if (currency) setCurrency(currency);
  },

  // Force end the session by logging out the user
  logout: () => {
    const { logout } = useActiveSession().useActions();
    logout();
  }
};
