// -----------------------------------------------------------------------------
/**
 * @module product-setup/types
 * @description Type definitions for product-setup components.
 */

import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

export type ProductSetupProps = {
  basketRoute?: RouteLocationAsRelativeGeneric;
  hideSlots?: string[];
};

export type ProductSetupFormProps = {
  bpid: string;
};
