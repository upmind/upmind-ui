import type {
  Product,
  ProductSummaryDetail
} from "@upmind-automation/headless";

export interface PricingItemProps extends ProductSummaryDetail {
  i18nCategory?: string;
  icon?: string;
}

export interface PricingListProps {
  pricing: Product["pricing"];
  details: Product["details"];
  processing?: boolean;
  loading?: boolean;
  total?: boolean;
}
