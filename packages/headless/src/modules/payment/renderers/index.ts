// --- external

// --- internal

// --- renderers
import mercadoPagoRenderer from "./mercadoPago";

// --- types
import type { ChallengeRendererConfig } from "./types";
import { GatewayProviderCodes } from "@upmind-automation/types";

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
