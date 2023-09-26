import type { StateMachine } from "xstate";

// --------------------------------------------------------
// Contexts

export interface BrandContext {
  url: string | null;
  init: BrandInit | null;
  useCache: boolean | null;
  hash: string | null;
  maxAge: number;
  // ---
  data: FetchResponse["data"] | null;
}

export interface BrandsContext {
  requests: Record<string, StateMachine>;
}

// --------------------------------------------------------
// Events

export interface BrandEvent {
  type: string;
  data: {
    url: string;
    init: BrandInit;
    useCache: boolean;
    hash: string;
  };
  error?: FetchError;
}

export type BrandEvents = {
  type: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "CANCEL" | "RETRY";
  data: BrandEvent;
};

export type BrandsEvents = {
  type: "ADD" | "REMOVE" | "STASH" | "DUMP" | "CANCEL" | "RETRY";
  data: any;
};
