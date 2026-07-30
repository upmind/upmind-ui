// --- internal
import { useBrand } from "@upmind-automation/client-vue";
import { BrandConfigKeys, CheckoutFlows } from "@upmind-automation/types";
import { FUNNEL } from "./types";
import type { FunnelId } from "./types";

// -----------------------------------------------------------------------------

/**
 * The brand's default funnel — mirrors `guardCheckoutFlow`. One-page and
 * stepped are opt-in variants of the cart funnel, each selected only when the
 * brand explicitly asks for it; everything else falls back to the cart funnel.
 * `?funnel=` can still switch between funnels at runtime.
 */
export function getDefaultFunnel(): FunnelId {
  const { getConfigValue } = useBrand();
  const checkoutFlow = getConfigValue(BrandConfigKeys.CHECKOUT_FLOW);

  if (checkoutFlow === CheckoutFlows.ONE_PAGE) return FUNNEL.ONE_PAGE;

  if (checkoutFlow === CheckoutFlows.STEPPED) return FUNNEL.STEPPED;

  return FUNNEL.CART;
}
