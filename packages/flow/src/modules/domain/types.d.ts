// --- enums

export enum DomainType {
  New = "New",
  Internal = "Internal",
  External = "External"
}

// --- Contexts

interface InternalDomainContext {
  type: DomainType.New | DomainType.Internal;
  domain: string;
  // --- Should these not rather be computed?
  sld: string;
  tld: string;
  // --- Options for New/Internal domains
  id: string;
  billing_cycle_years: number;
  is_available: boolean;
  is_discounted: boolean;
  percentage_saving: nymber;
  price_discounted_formatted: string;
  price_formatted: string;
}

interface ExternalDomainContext {
  type: DomainType.External;
  domain: string;
  // --- Should these not rather be computed?
  sld: string;
  tld: string;
}

export interface DomainsContext {
  domains: Record<string, InternalDomainContext | ExternalDomainContext>;
  currencyCode: string;
  coupons: Array<string>;
}

// --- Events

export type AddEvent = {
  type: "ADD";
  data: InternalDomainContext | ExternalDomainContext;
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
export type DomainEvents = ResetEvent | AddEvent | RemoveEvent;
