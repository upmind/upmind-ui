import type {
  Product,
  ProductSummaryDetail
} from "@upmind-automation/headless";

export interface SummaryItemProps extends ProductSummaryDetail {
  i18nCategory?: string;
  icon?: string;
}

export interface SummaryPricingProps {
  pricing: Product["pricing"];
  details: Product["details"];
  processing?: boolean;
  loading?: boolean;
}
