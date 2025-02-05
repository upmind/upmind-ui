// --- internal
import type { BasketProduct } from "../basket/types";
import type { ProductModel } from "../product/types";
import type { ActorRef } from "xstate";

// --- enums

// export enum DomainTypes {
//   register = "Register a new domain",
//   transfer = "Transfer your domain from another registrar",
//   existing = "I will use my existing domain and update my nameservers",
//   basket = "I will use a domain from my basket",
// }
/**
 * @ignore
 */
export enum DomainTypes {
  register = "register",
  transfer = "transfer",
  existing = "existing",
  basket = "basket",
}

// --- Interfaces

export interface DomainProduct {
  type?: DomainTypes;
  domain: string;
  sld?: string;
  tld?: string;
  // --- Options for New/Internal domains
  productId: string;
  quantity?: number;
  cycle?: number;
  options?: object;
  attributes?: object;

  summary?: {
    isAvailable?: boolean;
    isFree?: boolean;
    currentAmount?: number;
    currentPrice?: string;
    regularAmount?: number;
    regularPrice?: string;
    meta: {
      discounted?: boolean;
      free?: boolean;
      oneoff?: boolean;
    };
  };

  // ---
  isPrimary?: boolean;
}

/**
 * @ignore
 */
export interface IDomain {
  type: DomainTypes;
  domain: string;
  // --- Should these not rather be computed?
  sld: string;
  tld: string;
  isPrimary: boolean;
}

/**
 * @ignore
 */
export interface IDomainSearch {
  domain: string;
  offset: number;
}

// --- Contexts

/**
 * @ignore
 */
export interface DomainContext {
  choices: Partial<DomainTypes>;
  type?: DomainTypes;
  model?: Array<DomainProduct | IDomain>;
  baseModel?: Array<DomainProduct | IDomain>;
  lookups?: {
    searched: Array<DomainProduct>;
    history: Array<DomainProduct>;
    owned: Array<DomainProduct>;
    basket: Array<DomainProduct>;
  };
  total?: number;
  // ---
  search?: {
    value: string;
    limit: number;
    offset: number;
    total: number;
  };
  currency?: string;
  promotions?: Array<string>;
  controller?: AbortController;
  tlds?: Array<string>;
  // ---
  error?: any;
  // ---
  authHelper?: ActorRef<any>;
  basketHelper?: ActorRef<any>;
  itemBuilder?: (item: ProductModel) => ProductModel;
  basketItemMapper?: (item: BasketProduct) => Partial<BasketProduct>;
  basketItemBuilder?: (model: ProductModel) => BasketProduct;
  basketProducts?: DomainProduct[];
  //
}

// --- Events
/**
 * @ignore
 */
export type SearchEvent = {
  type: "SEARCH";
  data: IDomainSearch;
};

/**
 * @ignore
 */
export type AddEvent = {
  type: string; //"ADD";
  data?: DomainProduct | IDomain;
};

/**
 * @ignore
 */
export type RemoveEvent = {
  type: "REMOVE";
  data: string;
};

/**
 * @ignore
 */
export type ResetEvent = {
  type: "CLEAR";
};

// Create a type which represents only one of the above types
// but you aren't sure which it is yet.
/**
 * @ignore
 */
export type DomainEvents = ResetEvent | AddEvent | RemoveEvent | SearchEvent;
