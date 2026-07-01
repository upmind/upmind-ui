import {
  assign,
  useBasketProducts,
  useQueryParams,
  type FunnelProps,
  getDomainBasketProducts
} from "@upmind-automation/client-vue";
import actions from "./engine/actions";
import guards from "./engine/guards";
import services from "./engine/services";
import { ROUTE } from "./types";
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

export default <FunnelProps>{
  id: "domains",
  states: {
    /**
     * 🎯 idle (override)
     * This is the idle state of the funnel, which acts as a catch-all for unsupported routes.
     * If the current route is not one of the supported routes for this funnel,
     * and there is a meaningful target route set, it transitions to the 'complete' state
     * to allow the default funnel to take over the navigation.
     */
    idle: {
      always: [
        {
          target: "#complete",
          cond: "isUnsupportedRoute"
        }
      ]
    },

    /**
     * 🎯 ROUTE.LOADING ** TRANSITIONAL STATE **
     * This is the initial loading state of the funnel.
     * It sets up the necessary context by setting the currency and product configurations.
     * Depending on whether product configurations are present,
     * it transitions to either the PRODUCT route (if configurations exist)
     * or the CATALOGUE route (if no configurations are found).
     */
    [ROUTE.LOADING]: {
      entry: ["setUnresolved", "clearTarget"],
      always: [
        { target: ROUTE.PRODUCT, cond: "hasProductConfigs" },
        { target: "#complete" }
      ]
    },

    /**
     * 🎯 ROUTE.PRODUCT ** TRANSITIONAL STATE **
     * This state handles the product configuration process.
     * It ensures that the product is properly configured before proceeding.
     * Upon successful configuration, it transitions to the 'complete' state,
     * setting the target route to DOMAINS_WITH_PRODUCT.
     * In case of an error during configuration, it also transitions to 'complete',
     * allowing for graceful handling of configuration failures.
     */
    [ROUTE.PRODUCT]: {
      entry: [
        "setCurrency",
        "setProductConfigs",
        "forceAutoupdate",
        "setUnresolved",
        "clearTarget"
      ],
      invoke: {
        src: "guardProductConfigure",
        onDone: {
          target: "#complete",
          actions: ["setCompleteRoute"]
        },
        onError: {
          target: "#complete",
          actions: ["setCompleteRoute"]
        }
      }
    }
  },
  guards,
  actions: {
    ...actions,
    setCompleteRoute: assign({
      targetRoute: ({ currentRoute }) => {
        const { productId } = useQueryParams(currentRoute);
        const { products } = useBasketProducts();
        const domains = getDomainBasketProducts(products.value);

        const hasDomains = !isEmpty(domains);
        // if we already have domains in the basket then go to DOMAINS_WITH_PRODUCT_PROCESSING
        const route = hasDomains
          ? ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING
          : ROUTE.DOMAINS_WITH_PRODUCT;

        return { name: route, params: { pid: productId } };
      },
      resolved: false
    })
  },
  services
};
