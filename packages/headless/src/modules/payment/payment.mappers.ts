/** @internal */
import renderers from "./renderers/index";
import { get, has } from "lodash-es";
import type { PaymentContext } from "./payment.types";
import type { ChallengeRendererConfig } from "./renderers/types";
import type { GatewayProviderCodes } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * Maps the 3DS challenge data from the payment response.
 * Supports both redirect-based challenges (offsite) and internal challenges (inline verification).
 */
export const mapApproval = (payment: PaymentContext["payment"]) => {
  // Now we have to parse the approval_url object that is part of the payment
  // into a "form" friendly format:- so we map any query params into fields
  // that will in turn be converted to hidden inputs in the form
  // Remember we may have  been given fields already, so we need to append them
  if (!payment?.approval_url) return undefined;

  const approval_url = payment.approval_url;
  const fields = approval_url?.fields || {};
  const url = new URL(approval_url.url);
  url.searchParams.forEach((value, key) => (fields[key] = value));

  return {
    url: [url.origin, url.pathname].join(""), // only the url without query params
    method: approval_url.method,
    fields
  };
};

/**
 * Maps a gateway provider code to its challenge renderer configuration.
 * Returns undefined if no renderer is available for the given gateway.
 *
 * @param code - The gateway provider code (e.g., GatewayProviderCodes.MERCADO_PAGO)
 * @returns The renderer configuration or undefined
 */
export const mapRenderer = (
  code: GatewayProviderCodes
): ChallengeRendererConfig | undefined => {
  return get(renderers, code);
};

/**
 * Check if a renderer exists for the given gateway provider code.
 * @param code - The gateway provider code
 * @returns True if a renderer is registered for this gateway
 */
export const hasRenderer = (code: GatewayProviderCodes): boolean => {
  return has(renderers, code);
};
