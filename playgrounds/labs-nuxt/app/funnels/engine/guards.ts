import { useBasket } from "@upmind-automation/client-vue";
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
