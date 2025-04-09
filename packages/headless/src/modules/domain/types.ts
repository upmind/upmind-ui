//  --- external
import type { ActorRef } from "xstate";

// --- internal
import { IBasketPromotion } from "@upmind-automation/types";
import type { ProductSummaryDetail, ProductModel, Promotion } from "../product";
import type {
  BasketHelperContext,
  BasketProductSummaryMeta,
  BasketProductSummaryPrice,
} from "../basketProduct";

// -----------------------------------------------------------------------------

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

export interface DomainProduct
  extends ProductModel,
    Domain,
    Omit<BasketProductSummaryPrice, "quantity"> {
  promotions?: Promotion[];
}

export interface Domain {
  domain: string;
  tld: string;
  sld: string;
  type?: DomainTypes;
  selected?: boolean;
}

export interface DomainLookup extends DomainProduct {
  value?: string;
  meta: BasketProductSummaryPrice["meta"] & {
    available?: boolean;
    owned?: boolean;
    added?: boolean;
    disabled?: boolean;
  };
}

export interface DomainSearch {
  domain: string;
  offset: number;
}

export interface DomainContext extends BasketHelperContext<DomainProduct> {
  choices: DomainTypes[];
  type?: DomainTypes;
  model?: Domain[];
  baseModel?: Domain[];
  lookups: {
    searched: DomainLookup[];
    history: DomainProduct[];
    owned: DomainProduct[];
    basket: DomainLookup[];
  };
  total?: number;
  preferredCycle?: number;
  // ---
  search?: {
    limit: number;
    offset: number;
    total: number;
    query?: string;
  };
  currency?: string;
  promotions?: IBasketPromotion[];
  controller?: AbortController;
  tlds?: string[];
  // ---
  error?: any;
  // ---
  authHelper?: ActorRef<any>;
  basketHelper?: ActorRef<any>;
}
