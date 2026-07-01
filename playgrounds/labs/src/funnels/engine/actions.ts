import { useActiveSession } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

/**
 * Actions to perform specific tasks during state transitions.
 * These actions cannot be asynchronous.
 * @param context
 * @returns  void
 */
export default {
  // Force end the session by logging out the user
  logout: () => {
    const { logout } = useActiveSession().useActions();
    logout();
  }
};
