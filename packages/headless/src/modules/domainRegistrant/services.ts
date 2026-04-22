// --- internal
import { useSession } from "../session";
import { useBasketProduct } from "../basketProduct";

// --- utils
import { NotAuthenticatedError } from "../../utils";
import { mapBillingToProvisionFields } from "./utils";
import { isEmpty, map } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { DomainRegistrantContext } from "./types";

// -----------------------------------------------------------------------------
/**
 * @module domainRegistrant/services
 * @description Services for the domain registrant machine.
 */

// -----------------------------------------------------------------------------

/**
 * Applies data to selected domain products in parallel.
 * Handles both APPLY_BILLING (maps billing→provision) and APPLY_PROVISION (raw data).
 *
 * @returns Array of results per product: { productId, success }
 */
async function applyToBasket(
  context: DomainRegistrantContext,
  event: AnyEventObject
) {
  const { model, lookups } = context;

  if (!model || model.length === 0) {
    throw new Error("No products selected");
  }

  // Apply to each selected product in parallel
  const results = await Promise.allSettled(
    map(model, async productId => {
      // Verify product exists in basket
      const exists = lookups.basketProducts.some(p => p.id === productId);
      if (!exists) {
        return { productId, success: false };
      }

      try {
        const basketProduct = useBasketProduct(productId);
        const existing = basketProduct.model.value?.provisionFields;

        // Determine the data to apply based on event type
        let dataToApply: Record<string, any>;

        if (event.type === "APPLY_PROVISION") {
          dataToApply = (event.data as Record<string, string>) ?? {};
        } else {
          dataToApply =
            mapBillingToProvisionFields(event.billing, existing) ?? {};
        }

        if (isEmpty(dataToApply)) {
          return { productId, success: false };
        }

        await basketProduct.setProvisioningFields(dataToApply);
        await basketProduct.update();
        return { productId, success: true };
      } catch {
        return { productId, success: false };
      }
    })
  );

  // Extract values from settled promises
  return map(results, result =>
    result.status === "fulfilled"
      ? result.value
      : { productId: "", success: false }
  );
}

async function loadLookups() {
  const { meta, client } = useSession();

  if (!meta.value.isAuthenticated || !client.value?.id) {
    throw new NotAuthenticatedError();
  }

  // Domain products are synced via basket subscription REFRESH events
  return {};
}

export default {
  applyToBasket,
  loadLookups,
  isAuthenticated: () => useSession().isAuthenticated()
};
