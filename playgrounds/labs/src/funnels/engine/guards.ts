import type {
  AnyEventObject,
  FunnelContext
} from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

/**
 * Guards to control transitions between states based on specific conditions.
 * @param context
 * @returns  boolean
 */
export default {
  /**
   * Returns true when the service response target matches the current route.
   * Used by SESSION states to detect when guardSession resolves back to the
   * same page (no returnUrl), so the funnel can fall through to its own default.
   */
  isSameRoute: ({ currentRoute }: FunnelContext, { data }: AnyEventObject) =>
    data?.target?.name === currentRoute?.name
};
