// --- external

// --- internal
import { useFunnelMachine } from "./funnel.machine";
import { useI18n } from "../system";

// --- utils
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { get } from "lodash-es";

// --- types
import type { RoutingEngineContext } from "./types";

// -----------------------------------------------------------------------------

/**
 * Service to execute the factory function and prepare the active machine instance.
 * Runs in the 'selectingFunnel' state.
 */
async function prepare({
  funnels,
  currentFunnel,
  defaultFunnel,
  targetRoute
}: RoutingEngineContext) {
  const { t } = useI18n();
  const funnelConfig = get(funnels, currentFunnel);
  // Add any provided target route to the funnel context
  const context = funnelConfig?.context ?? {};
  context.targetRoute = targetRoute;

  if (!funnelConfig) {
    if (!defaultFunnel) {
      throw new DetailedError(
        t("error.funnel_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      );
    }
    // Return the default machine config with an updated context
    return useFunnelMachine({ ...funnels[defaultFunnel], context });
  }

  return useFunnelMachine({ ...funnelConfig, context });
}

// -----------------------------------------------------------------------------

export default {
  prepare
};
