import type {
  TermDetails,
  PriceDisplayTypes
} from "@upmind-automation/headless";

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
  /** `true` when the product config has an active option/category overriding price — hides price/promo. */
  overridden?: boolean;
};
