// --- external
import type { ComputedRef } from "vue";

// --- types
import type { BasketProduct } from "../basketProduct";

// -----------------------------------------------------------------------------
/**
 * @module productSetup/types
 * @description Type definitions for the Product Setup flow.
 */

/**
 * Enumeration representing conditions that require product setup.
 */
export enum REQUIRES_SETUP {
  /** Product has validation errors requiring correction */
  INVALID = "invalid",
  /** Product is related to another product with errors */
  RELATED = "related"
}
