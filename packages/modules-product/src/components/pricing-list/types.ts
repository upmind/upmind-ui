import type {
  Product,
  ProductSummaryDetail
} from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

export type PricingItemProps = ProductSummaryDetail & {
  i18nCategory?: string;
  icon?: string;
};

export type PricingListProps = {
  pricing: Product["pricing"];
  details: Product["details"];
  processing?: boolean;
  loading?: boolean;
  total?: boolean;
  title?: string;
  options?: boolean;
  fields?: boolean;
};
