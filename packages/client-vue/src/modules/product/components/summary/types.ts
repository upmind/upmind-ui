import type { Product } from "@upmind-automation/headless-vue";

// TODO: Should we be exporting the types from headless-vue?
export interface SummaryListProps {
  details: Product["details"];
  productDetails: Product["productDetails"];
}

export interface SummaryItemProps {
  category: string;
  i18nCategory?: string;
  title?: string;
  quantity?: number;
  icon?: string;
}

export interface SummaryPricingProps {
  pricing: Product["pricing"];
  processing?: boolean;
  loading?: boolean;
}
