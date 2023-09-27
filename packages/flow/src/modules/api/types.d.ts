import type { StateMachine } from "xstate";

// --------------------------------------------------------
// Request Types

export interface RequestResponse {
  status: Response["status"];
  data: any;
}

export interface RequestError {
  status?: number;
  message?: string;
  data?: Record<string, any>;
}

export interface RequestParams {
  url: string;
  init?: RequestInit | null;
  useCache?: boolean | null;
  maxAge?: number | null;
  data?: any;
}

// --------------------------------------------------------
// Context Types

export interface RequestContext {
  url: string | null;
  init: RequestInit | null;
  useCache: boolean | null;
  hash: string | null;
  maxAge: number;
  // ---
  response: null | RequestResponse["data"];
  error: null | RequestError;
  parent: null | StateMachine;
}

export interface RequestsContext {
  requests: Record<string, StateMachine>;
}

// --------------------------------------------------------
// Event Types

export interface RequestEvent {
  type: string;
  data: {
    url: string;
    init: RequestInit;
    useCache: boolean;
    hash: string;
  };
  error?: RequestError;
}

export type RequestEvents = {
  type: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "CANCEL" | "RETRY";
  data: RequestEvent;
};

export type RequestsEvents = {
  type: "ADD" | "REMOVE" | "STASH" | "DUMP" | "CANCEL" | "RETRY";
  data: any;
};
