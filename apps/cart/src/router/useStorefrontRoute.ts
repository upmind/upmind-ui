// -----------------------------------------------------------------------------
/**
 * @module cart/useStorefrontRoute
 * @description App-level composable that resolves the brand's storefront
 * configuration into a StorefrontRoute discriminated union.
 *
 * - External URL → `{ href: "https://…" }`
 * - Internal storefront → `{ to: { name: ROUTE.CATALOGUE } }`
 * - No storefront → `{ to: { name: ROUTE.BASKET } }` (fallback)
 */

import { computed } from "vue";
import { useBrand } from "@upmind-automation/client-vue";
import { ROUTE } from "./funnels/types";
import type { StorefrontRoute } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

export const useStorefrontRoute = () => {
  const { storefrontUrl, hasStorefront } = useBrand();

  const storefrontRoute = computed<StorefrontRoute>(() => {
    // Priority 1: External storefront URL (brand's main website)
    if (storefrontUrl.value) {
      try {
        const parsed = new URL(storefrontUrl.value);
        if (parsed.protocol && parsed.host) {
          return { href: storefrontUrl.value };
        }
      } catch {
        // Not a valid URL — fall through to internal route
      }
    }

    // Priority 2: Internal catalogue if storefront is enabled
    if (hasStorefront.value) {
      return { to: { name: ROUTE.CATALOGUE } };
    }

    // Fallback: basket page
    return { to: { name: ROUTE.BASKET } };
  });

  return {
    /** Resolved storefront route — either `{ href }` or `{ to }`. */
    storefrontRoute
  };
};

export type UseStorefrontRoute = ReturnType<typeof useStorefrontRoute>;
