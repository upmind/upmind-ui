// -----------------------------------------------------------------------------
/**
 * @module domain/utils
 * @description Utility functions for domain registrant UI components.
 */

// --- types
import type { BasketProduct } from "@upmind-automation/headless";
import type { DomainRegistrantStatus } from "./types";

// -----------------------------------------------------------------------------

/**
 * Converts a basket product to a domain registrant status for checkbox display.
 */
export function toDomainRegistrantStatus(
  product: BasketProduct
): DomainRegistrantStatus {
  return {
    productId: product.id,
    domain: product.serviceIdentifier ?? product.productDetails?.title ?? ""
  };
}
