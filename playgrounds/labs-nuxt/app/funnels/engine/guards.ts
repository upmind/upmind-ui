import { useActiveSession } from "@upmind-automation/client-vue";
// -----------------------------------------------------------------------------
/**
 * Guards to control transitions between states based on specific conditions.
 */
export default {
  needsAuth: () => !useActiveSession().useMeta().isAuthenticated.value
};
