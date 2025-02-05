// --- external

// --- internal
import { useRoutingEngine } from "..";
import { useBasketFlows } from "./basket";
import { useProductFlows } from "./product";
import { useRecommendationsFlows } from "./recomendations";
import { useSessionFlows } from "./session";
import { useCheckoutFlows } from "./checkout";
import { useOrderFlows } from "./order";

// --- utils

// --- types
import type { Flow } from "../types";

// -----------------------------------------------------------------------------

export const useRoutingFlows = () => {
  const routing = useRoutingEngine();

  const basketFlows = useBasketFlows();
  const productFlows = useProductFlows();
  const recommendationsFlows = useRecommendationsFlows();
  const sessionFlows = useSessionFlows();
  const checkoutFlows = useCheckoutFlows();
  const orderFlows = useOrderFlows();

  return {
    basket: basketFlows,
    product: productFlows,
    recommendations: recommendationsFlows,
    session: sessionFlows,
    checkout: checkoutFlows,
    order: orderFlows,
    // ---
    register: (data?: Flow[]) => {
      // register our default flows
      basketFlows.register();
      productFlows.register();
      recommendationsFlows.register();
      sessionFlows.register();
      checkoutFlows.register();
      orderFlows.register();
      // ---
      if (data) routing.register(data);
    },
  };
};

export {
  useBasketFlows,
  useProductFlows,
  useRecommendationsFlows,
  useSessionFlows,
  useCheckoutFlows,
  useOrderFlows,
};
