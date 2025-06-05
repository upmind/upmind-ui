import type {
  Product,
  ProductSummaryDetail,
} from "@upmind-automation/headless";

export interface SummaryItemProps extends ProductSummaryDetail {
  i18nCategory?: string;
  icon?: string;
}

export interface SummaryPricingProps {
  pricing: Product["pricing"];
  processing?: boolean;
  loading?: boolean;
}
