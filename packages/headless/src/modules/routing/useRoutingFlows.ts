// --- external

// --- internal
import { useRoutingEngine } from ".";
import { useCatalogueFlows } from "./flows/catalogue";
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
import { isPromise } from "util/types";
import { isFunction } from "xstate/lib/utils";
export * from "./types";

// -----------------------------------------------------------------------------

export const useRoutingFlows = () => {
  const routing = useRoutingEngine();
  const catalogueFlows = useCatalogueFlows();
  const basketFlows = useBasketFlows();
  const productFlows = useProductFlows();
  const recommendationsFlows = useRecommendationsFlows();
  const sessionFlows = useSessionFlows();
  const checkoutFlows = useCheckoutFlows();
  const orderFlows = useOrderFlows();

  return {
    catalogue: catalogueFlows,
    basket: basketFlows,
    product: productFlows,
    recommendations: recommendationsFlows,
    session: sessionFlows,
    checkout: checkoutFlows,
    order: orderFlows,
    // ---
    register: (customFlows?: Flow[] | (() => Flow[])) => {
      // if customFlows is a function, we need to call it to get the flows
      const safeFlows = isFunction(customFlows)
        ? (customFlows() ?? [])
        : (customFlows ?? []);

      // register our default flows
      const flows = uniqBy(
        concat(
          safeFlows,
          catalogueFlows.getFlows(),
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
    }
  };
};

export {
  useBasketFlows,
  useProductFlows,
  useRecommendationsFlows,
  useSessionFlows,
  useCheckoutFlows,
  useOrderFlows
};
