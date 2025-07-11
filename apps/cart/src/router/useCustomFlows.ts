// --- internal
import { useRoutingFlows } from "@upmind-automation/client-vue";

// --- utils
import { concat, reduce, forEach, isObject, reject } from "lodash-es";

// --- types
import { ROUTE, type Flow, type Target } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

function ignoredTarget(target: Target) {
  if (
    (isObject(target) &&
      (target.name === ROUTE.CHECKOUT ||
        target.name.includes(ROUTE.SESSION))) ||
    target === ROUTE.CHECKOUT ||
    target.toString().includes(ROUTE.SESSION)
  ) {
    return true;
  } else {
    return false;
  }
}

export const useCustomFlows = () => {
  const { product, recommendations } = useRoutingFlows();

  // So the idea her eis to override the default targets for the flows that deal with products.
  // Currently they try go to checkout ( via session ).
  // In this case we just want to ignore/remove any targets to checkout or sesison,
  // ---
  // So we get the default flows so we can override them instead of recreating them,
  // and strip out the routes we dont want as a target, and just go to basket after working with the product
  // its a little verbose, but it is a lot easier than recreating the flows

  const productFlows = product.getFlows();
  const recommendationFlows = recommendations.getFlows();

  forEach(productFlows, (flow: Flow) => {
    if (flow.targets?.next)
      flow.targets.next = reject(flow.targets.next, ignoredTarget);
  });

  forEach(recommendationFlows, (flow: Flow) => {
    if (flow.targets?.next)
      flow.targets.next = reject(flow.targets.next, ignoredTarget);
  });

  // ---------------------------------------------------------------------------
  return concat([], productFlows, recommendationFlows);
};
