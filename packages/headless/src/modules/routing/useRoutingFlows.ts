// --- external

// --- internal
import { useRoutingEngine } from ".";
import { useBasketFlows } from "./flows/basket";
import { useProductFlows } from "./flows/product";
import { useRecommendationsFlows } from "./flows/recomendations";
import { useSessionFlows } from "./flows/session";
import { useCheckoutFlows } from "./flows/checkout";
import { useOrderFlows } from "./flows/order";

// --- utils
import { uniqBy, concat } from "lodash-es";

// --- types
import type { Flow } from "./types";
export * from "./types";

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
    register: (customFlows?: Flow[]) => {
      // register our default flows
      const flows = uniqBy(
        concat(
          customFlows ?? [],
          basketFlows.getFlows(),
          productFlows.getFlows(),
          recommendationsFlows.getFlows(),
          sessionFlows.getFlows(),
          checkoutFlows.getFlows(),
          orderFlows.getFlows()
        ),
        "name"
      );
      // ---
      routing.register(flows);
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
