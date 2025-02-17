import type { VariantProps } from "class-variance-authority";
import type { currentVariants, exVariants } from "./config.cva";
export type ExVariantProps = VariantProps<typeof exVariants>;
export type CurrentVariantProps = VariantProps<typeof currentVariants>;

interface BasePrice {
  cycle?: number | string;
  meta?: {
    discounted?: boolean;
    free?: boolean;
  };
  showCycle?: boolean;
  uiConfig?: {
    pricing: {
      ex?: ExVariantProps;
      current?: CurrentVariantProps;
    };
  };
}

export interface ExPriceProps extends BasePrice {
  regularPrice?: number | string;
  monthlyFromRegularPrice?: number | string;
}

export interface CurrentPriceProps extends BasePrice {
  currentPrice?: number | string;
  monthlyFromCurrentPrice?: number | string;
}

export interface PricingProps extends ExPriceProps, CurrentPriceProps {}
