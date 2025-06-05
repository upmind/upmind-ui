import type { VariantProps } from "class-variance-authority";
import type { currentVariants, exVariants } from "./pricing.config";
import type { ProductSummaryDetailWithPrice } from "@upmind-automation/headless";
export type ExVariantProps = VariantProps<typeof exVariants>;
export type CurrentVariantProps = VariantProps<typeof currentVariants>;

interface BasePrice {
  cycle?: ProductSummaryDetailWithPrice["cycle"];
  meta?: ProductSummaryDetailWithPrice["meta"];
  showCycle?: boolean;
  uiConfig?: {
    pricing: {
      ex?: ExVariantProps;
      current?: CurrentVariantProps;
    };
  };
}

export interface ExPriceProps extends BasePrice {
  regularPrice: string;
  monthlyFromRegularPrice?: string;
}

export interface CurrentPriceProps extends BasePrice {
  currentPrice: string;
  monthlyFromCurrentPrice?: string;
}

export interface PricingProps extends ExPriceProps, CurrentPriceProps {}
