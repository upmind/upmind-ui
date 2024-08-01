// --- internal

// --- enums

// export enum DomainTypes {
//   register = "Register a new domain",
//   transfer = "Transfer your domain from another registrar",
//   existing = "I will use my existing domain and update my nameservers",
//   basket = "I will use a domain from my basket",
// }
export enum DomainTypes {
  register = "register",
  transfer = "transfer",
  existing = "existing",
  basket = "basket",
}

// --- Interfaces

export interface IDomainProduct {
  type: DomainTypes.New | DomainTypes.Internal;
  domain: string;
  sld: string;
  tld: string;
  // --- Options for New/Internal domains
  product_id: string;
  billing_cycle_years: number;
  is_available: boolean;
  is_discounted: boolean;
  percentage_saving: nymber;
  price_discounted_formatted: string;
  price_formatted: string;
  // ---
  is_primary: boolean;
}

interface IDomain {
  type: DomainTypes.External;
  domain: string;
  // --- Should these not rather be computed?
  sld: string;
  tld: string;
  is_primary: boolean;
}

interface IDomainSearch {
  domain: string;
  offset: number;
}

// --- Contexts

export interface DomainContext {
  choices: Object<DomainTypes>;
  type?: DomainTypes;
  values?: Array<IDomainProduct | IDomain>;
  available?: Array<IDomainProduct>;
  total?: number;
  // ---
  search?: string;
  currency?: string;
  promotions?: Array<string>;
  limit?: number;
  offset?: number;
  controller?: AbortController;
  tlds?: Array<string>;
  // ---
  error?: any;
  // ---
  sync?: boolean;
  basketHelper?: Function;
  //
}

// --- Events
export type SearchEvent = {
  type: "SEARCH";
  data: IDomainSearch;
};

export type AddEvent = {
  type: "ADD";
  data: IDomainProduct | IDomain;
};

export type RemoveEvent = {
  type: "REMOVE";
  data: string;
};

export type ResetEvent = {
  type: "CLEAR";
};

// Create a type which represents only one of the above types
// but you aren't sure which it is yet.
export type DomainEvents = ResetEvent | AddEvent | RemoveEvent | SearchEvent;
