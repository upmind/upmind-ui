import type { currentVariants, exVariants } from "./variants";
import type { BadgeVariants } from "@upmind/ui";
import type {
  ProductSummaryDetailWithPrice,
  PromotionDetails
} from "@upmind-automation/headless";
import type { CxOptions, VariantProps } from "class-variance-authority";
// -----------------------------------------------------------------------------

export type ExVariantProps = VariantProps<typeof exVariants>;
export type CurrentVariantProps = VariantProps<typeof currentVariants>;

type BasePrice = {
  is?: string;
  cycle?: ProductSummaryDetailWithPrice["cycle"];
  // meta?: ProductSummaryDetailWithPrice["meta"];
  useMonthlyFromPrice?: boolean;
  loading?: boolean;
  /** Overrides the component's default test key (routed through useTestAttrs). */
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
  uiConfig?: {
    pricing: {
      ex?: CxOptions;
      current?: CxOptions;
    };
  };
};

export type ExPriceProps = BasePrice & {
  regularPrice: string;
  monthlyFromRegularPrice: string;
  discounted: boolean;
  /** True when the BE has returned a custom (manually overridden) price (may be higher or lower than the pricelist price). */
  custom?: boolean;
};

export type CurrentPriceProps = BasePrice & {
  currentPrice: string;
  monthlyFromCurrentPrice?: string;
  free?: boolean;
};

export type PricingProps = ExPriceProps & CurrentPriceProps & {};

export type PromotionProps = PromotionDetails & {
  disabled?: boolean;
  size?: BadgeVariants["size"];
};
