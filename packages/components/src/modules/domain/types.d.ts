// --- internal
export type { IDomainProduct } from "@src/models/DomainProduct";
export type { IProductPrice } from "@src/models/ProductPrice";

// ---

export interface IDomainProductMapped {
  // --- domain data
  domain: string;
  sld: string;
  tld: IDomainProduct["tld"];
  // ---  basket item data
  pid: IDomainProduct["id"];
  billing_cycle_years: IProductPrice["billing_cycle_months"];
  //  --- meta
  billing_summary: string;
  is_available: boolean;
  is_discounted: boolean;
  percentage_saving: number;
  price_discounted_formatted: IProductPrice["price_discounted_formatted"];
  price_formatted: IProductPrice["price_formatted"];
}
