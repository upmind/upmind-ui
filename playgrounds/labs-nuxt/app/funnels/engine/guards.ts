import { useActiveSession } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------
/**
 * Guards to control transitions between states based on specific conditions.
 */
export default {
  needsAuth: () => !useActiveSession().useMeta().isAuthenticated.value
};
