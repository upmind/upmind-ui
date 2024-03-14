// --- internal
export type { IDomainProduct } from "@src/models/DomainProduct";
export type { IProductPrice } from "@src/models/ProductPrice";

// ---

export interface IDomainProductMapped {
  billing_cycle_years: IProductPrice["billing_cycle_months"];
  billing_summary: string;
  domain: string;
  is_available: boolean;
  is_discounted: boolean;
  percentage_saving: number;
  pid: IDomainProduct["id"];
  price_discounted_formatted: IProductPrice["price_discounted_formatted"];
  price_formatted: IProductPrice["price_formatted"];
  sld: string;
  tld: IDomainProduct["tld"];
  order_url?: URL | null;
}
