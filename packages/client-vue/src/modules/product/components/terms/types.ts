import type { PriceDisplayTypes } from "@upmind-automation/types";
import type { TermDetails } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
/**
 * @module product/terms.types
 * @description Type definitions for the term card component.
 */

export type TermCardProps = TermDetails & {
  summary?: boolean;
  layout?: "stacked" | "inline";
  /** Override the price display format. When set, takes precedence over `meta.useMonthlyFromPrice`. */
  type?: PriceDisplayTypes;
};
