import type { SubproductValue } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

/**
 * One subproduct option resolved for rendering: the raw value plus the
 * per-option config the mapper reads (group, image, description mode).
 */
export type SubproductOption = SubproductValue & {
  groupLabel?: string;
  groupIcon?: string;
  image?: string;
  descriptionIsInline?: boolean;
  descriptionIsTooltip?: boolean;
};
