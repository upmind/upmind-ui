import { isEmpty } from "lodash-es";

import {
  type AnyEventObject,
  type FunnelContext,
  useBasket,
  useQueryParams
} from "@upmind-automation/client-vue";
import type { RouteLocationGeneric } from "vue-router";

// -----------------------------------------------------------------------------

/**
 * Guards to control transitions between states based on specific conditions.
 * @param context
 * @returns  boolean
 */
export default {
  needsAuth: () => {
    const { meta } = useBasket();
    return meta.value?.needsAuth;
  }
};
