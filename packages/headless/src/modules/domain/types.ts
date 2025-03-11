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
  productId?: string;
  quantity?: number;
  cycle?: number;
  options?: Object;
  attributes?: Object;

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

export interface Domain {
  type: DomainTypes;
  domain: string;
  // --- Should these not rather be computed?
  sld: string;
  tld: string;
  isPrimary: boolean;
}

export interface DomainLookup extends DomainProduct {
  value?: string;
  isOwned?: boolean;
  inBasket?: boolean;
  disabled?: boolean;
}
export interface DomainSearch {
  domain: string;
  offset: number;
}

// --- Contexts

export interface DomainContext {
  choices: DomainTypes[];
  type?: DomainTypes;
  model?: DomainProduct[];
  baseModel?: DomainProduct[];
  lookups?: {
    searched: DomainLookup[];
    history: DomainProduct[];
    owned: DomainProduct[];
    basket: DomainProduct[];
  };
  total?: number;
  // ---
  search?: {
    limit: number;
    offset: number;
    total: number;
    query: string;
  };
  currency?: string;
  promotions?: string[];
  controller?: AbortController;
  tlds?: string[];
  // ---
  error?: any;
  // ---
  authHelper: ActorRef<any>;
  basketHelper: ActorRef<any>;
  itemBuilder?: (item: any) => DomainProduct;
  basketItemBuilder?: (model: DomainProduct) => ProductModel | undefined;
  basketItemMapper?: (item: BasketProduct) => Partial<ProductModel>;
  basketProducts?: DomainProduct[];
  //
}
