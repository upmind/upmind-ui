//  --- external
import type { ActorRef } from "xstate";

// --- internal
import { IBasketPromotion } from "@upmind-automation/types";
import type { Product, ProductSummaryDetail } from "../product";
import type { BasketHelperContext } from "../basketProduct";
import { ResponseError } from "../query";

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

export type DomainProduct = Product &
  Omit<DomainModel, "selected"> & {
    meta: ProductSummaryDetail["meta"] & {
      available?: boolean;
      owned?: boolean;
      added?: boolean;
      disabled?: boolean;
      selected?: boolean;
      persisted?: boolean;
    };
  };

export type DomainModel = {
  domain: string;
  tld: string;
  sld: string;
  type?: DomainTypes;
  selected?: boolean;
};

export type DomainSearch = {
  domain: string;
  offset: number;
};

export type DomainProps = {
  type?: DomainTypes;
};

export type DomainContext = BasketHelperContext<DomainProduct> & {
  choices: DomainTypes[];
  type?: DomainProps["type"];
  // ---
  model?: DomainModel[];
  baseModel?: DomainModel[];
  // ---
  lookups: {
    searched: DomainProduct[];
    history: DomainProduct[];
    owned: DomainProduct[];
    basket: DomainProduct[];
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
  error?: ResponseError;
  // ---
  authHelper?: ActorRef<any>;
  basketHelper?: ActorRef<any>;
};
