// -----------------------------------------------------------------------------
/**
 * @module cart-nuxt/useStorefrontRoute
 * @description App-level composable that resolves the brand's storefront
 * configuration into a StorefrontRoute discriminated union.
 */

import { computed } from "vue";
import { useBrand } from "@upmind-automation/client-vue";
import type { StorefrontRoute } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

export const useStorefrontRoute = () => {
  const { storefrontUrl, hasStorefront } = useBrand();

  const storefrontRoute = computed<StorefrontRoute>(() => {
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

    if (hasStorefront.value) {
      return { to: { name: ROUTE.CATALOGUE } };
    }

    return { to: { name: ROUTE.BASKET } };
  });

  return {
    /** Resolved storefront route — either `{ href }` or `{ to }`. */
    storefrontRoute
  };
};

export type UseStorefrontRoute = ReturnType<typeof useStorefrontRoute>;
