import { GatewayProviderCodes } from "@upmind-automation/types";
import mercadoPagoRenderer from "./mercadoPago";
import type { ChallengeRendererConfig } from "./types";

// -----------------------------------------------------------------------------

/**
 * Map of gateway provider codes to their challenge renderer configurations.
 * Uses GatewayProviderCodes enum values as keys for consistency.
 */
const renderers: Partial<
  Record<GatewayProviderCodes, ChallengeRendererConfig>
> = {
  [GatewayProviderCodes.MERCADO_PAGO]: mercadoPagoRenderer
  // Add additional gateway renderers here as they are implemented
  // [GatewayProviderCodes.STRIPE]: stripeRenderer,
};

export default renderers;
