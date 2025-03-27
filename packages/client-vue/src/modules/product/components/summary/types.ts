// TODO: Should we be exporting the types from headless-vue?
export interface SummaryListProps {
  summary: any;
  product: any;
}

export interface SummaryItemProps {
  category: string;
  i18nCategory?: string;
  title?: string;
  quantity?: number;
  icon?: string;
}

export interface SummaryPricingProps {
  summary: any;
  meta: any;
}
