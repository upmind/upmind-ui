export interface IDomain {
  product_id?: string;
  options?: Record<string, any>;
  attributes?: Record<string, any>;
  is_available?: boolean;
  tld: string;
  sld: string;
  domain: string;
  value: string;
  billing_cycle_months: number;
  is_discounted?: boolean;
  price_discounted?: number;
  price_discounted_formatted?: string;
  price?: number;
  price_formatted?: string;
  is_owned?: boolean;
  in_basket?: boolean;
}

export interface DomainCardProps extends IDomain {
  selected?: boolean;
  disabled?: boolean;
  processing?: boolean;
}
