// --- types
import { type FunnelProps } from "@upmind-automation/client-vue";
import { FUNNEL, ROUTE } from "./types";

// -----------------------------------------------------------------------------
// The stepped checkout as a modeled funnel path. Both flows own the same pages
// and the same fallback ladder — the only difference is where the funnel lands
// after the basket is ready. Stepped goes to the BASKET page first and reaches
// checkout from there; the base flow goes straight to CHECKOUT and falls back
// to billing / product setup only where a guard rejects.
// -----------------------------------------------------------------------------

export default <FunnelProps>{
  id: "stepped",
  extends: FUNNEL.CART,
  states: {
    /**
     * 🎯 ROUTE.CHECKOUT_FLOW ** TRANSITIONAL STATE **
     * The one node that makes the flow stepped: land on the basket rather than
     * the checkout. Everything downstream is inherited.
     */
    [ROUTE.CHECKOUT_FLOW]: {
      meta: { transitional: true },
      entry: ["setUnresolved", "clearTarget"],
      always: [{ target: ROUTE.BASKET }]
    }
  }
};
