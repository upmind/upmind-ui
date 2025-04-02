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
import { uniqBy, concat } from "lodash-es";

// --- types
import type { Flow } from "../types";
export * from "../types";

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
