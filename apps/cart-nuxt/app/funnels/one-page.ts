// --- types
import {
  type AnyEventObject,
  assign,
  type FunnelContext,
  type FunnelProps,
  QUERY_PARAMS,
  useBasket
} from "@upmind-automation/client-vue";
import { FUNNEL, ROUTE } from "./types";

// -----------------------------------------------------------------------------
// The one-page checkout as a modeled funnel path. It extends the cart funnel and
// overrides only where the all-in-one page diverges: CHECKOUT renders billing,
// product setup and payment inline, so guardCheckout's redirects to those
// standalone pages are absorbed rather than followed. Product setup has no page
// of its own here, so a direct hit on that route folds back; billing keeps its
// inherited page, because the checkout summary's Change sends there. Every other
// route — catalogue, product, recommendations, basket, session, order — is
// inherited unchanged.
// -----------------------------------------------------------------------------

export default <FunnelProps>{
  id: "one-page",
  extends: FUNNEL.CART,
  states: {
    /**
     * 🎯 ROUTE.BASKET_PRODUCTS_SETUP ** TRANSITIONAL STATE **
     * Product setup is a section of the all-in-one page, not a page of its own —
     * a direct hit on the standalone route folds straight back into CHECKOUT.
     */
    [ROUTE.BASKET_PRODUCTS_SETUP]: {
      meta: { transitional: true },
      entry: ["setUnresolved", "clearTarget"],
      always: [{ target: ROUTE.CHECKOUT }]
    },

    /**
     * 🎯 ROUTE.CHECKOUT — the all-in-one checkout.
     * Renders billing, product setup and payment inline (CheckoutInset).
     * Reuses the shared `guardCheckout` (auth → session step, unverified →
     * verify overlay, present products); NEXT completes the order on payment.
     * The only one-page difference lives HERE, in the funnel: guardCheckout's
     * billing / invalid-product rejects — which divert stepped flows to the
     * standalone BILLING / BASKET_PRODUCTS_SETUP pages — are absorbed and just
     * render inline.
     */
    [ROUTE.CHECKOUT]: {
      meta: { prev: ROUTE.BASKET },
      entry: ["setCurrency", "setBasket", "setBillingDefaults"],
      invoke: {
        src: "guardCheckout",
        onDone: { actions: ["setResolved"] },
        onError: [
          {
            target: ROUTE.SESSION,
            actions: ["setUnresolved", "setTargetRoute"],
            cond: "isSession"
          },
          {
            target: ROUTE.OVERLAY_VERIFY_EMAIL,
            actions: ["setUnresolved", "setOverlay"],
            cond: "isOverlay"
          },
          {
            target: ROUTE.BASKET,
            actions: ["setUnresolved", "clearTarget"],
            cond: "isBasket"
          },
          // guardCheckout wants to redirect (billing / product setup
          // incomplete), but those sections live on this page — so stay put
          { actions: [assign({ resolved: true })] }
        ]
      },
      on: {
        NEXT: {
          // Order completion — pull the OID from the checkout completion event.
          target: ROUTE.ORDER,
          actions: [
            assign({
              targetRoute: (
                _context: FunnelContext,
                { data }: AnyEventObject
              ) => {
                const { meta } = useBasket();
                const oid = data?.event?.id;
                return {
                  name: ROUTE.ORDER,
                  params: { oid },
                  query: {
                    [QUERY_PARAMS.PAYMENT_SUCCESS]:
                      meta.value.hasPaid.toString()
                  }
                };
              }
            })
          ]
        }
      }
    }
  }
};
