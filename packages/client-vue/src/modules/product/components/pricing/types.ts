import type { currentVariants, exVariants } from "./pricing.config";
import type { ProductSummaryDetailWithPrice } from "@upmind-automation/headless";
import type { CxOptions, VariantProps } from "class-variance-authority";

export type ExVariantProps = VariantProps<typeof exVariants>;
export type CurrentVariantProps = VariantProps<typeof currentVariants>;

interface BasePrice {
  is?: string;
  cycle?: ProductSummaryDetailWithPrice["cycle"];
  // meta?: ProductSummaryDetailWithPrice["meta"];
  useMonthlyFromPrice?: boolean;
  loading?: boolean;
  uiConfig?: {
    pricing: {
      ex?: CxOptions;
      current?: CxOptions;
    };
  };
}

export interface ExPriceProps extends BasePrice {
  regularPrice: string;
  monthlyFromRegularPrice: string;
  discounted: boolean;
  /** True when the BE has returned a custom (manually overridden) price (may be higher or lower than the pricelist price). */
  custom?: boolean;
}

export interface CurrentPriceProps extends BasePrice {
  currentPrice: string;
  monthlyFromCurrentPrice?: string;
  free?: boolean;
}

export interface PricingProps extends ExPriceProps, CurrentPriceProps {}
