// --- external

// --- internal
import { useFunnelMachine } from "./funnel.machine";
import { GLOBAL_OVERLAYS, createEndpointNodes } from "./overlays";
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
 *
 * Merges endpoint states from GLOBAL_OVERLAYS so overlay routes (e.g. basket--auth)
 * go through the funnel guard pipeline.
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

  // Generate endpoint state nodes from overlay definitions
  const endpoints = createEndpointNodes(GLOBAL_OVERLAYS);

  if (!funnelConfig) {
    if (!defaultFunnel) {
      throw new DetailedError(
        t("error.funnel_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      );
    }
    // Return the default machine config with an updated context + endpoints
    const config = funnels[defaultFunnel];
    return useFunnelMachine({
      ...config,
      context,
      states: { ...config.states, ...endpoints.states },
      guards: { ...config.guards, ...endpoints.guards },
      actions: { ...config.actions, ...endpoints.actions }
    });
  }

  return useFunnelMachine({
    ...funnelConfig,
    context,
    states: { ...funnelConfig.states, ...endpoints.states },
    guards: { ...funnelConfig.guards, ...endpoints.guards },
    actions: { ...funnelConfig.actions, ...endpoints.actions }
  });
}

// -----------------------------------------------------------------------------

export default {
  prepare
};
