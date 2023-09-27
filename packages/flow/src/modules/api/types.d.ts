import type { StateMachine } from "xstate";

interface CancellablePromise<T> extends Promise<T> {
  stop: () => void;
  abort: () => void;
}

export interface FetchResponse {
  status: Response["status"];
  data: any;
}

export interface FetchError {
  status?: number;
  message?: string;
  data?: Record<string, any>;
}

export interface useFetchParams {
  url: string;
  init?: RequestInit | null;
  useCache?: boolean | null;
  maxAge?: number | null;
  data?: any;
}

// --------------------------------------------------------
// Contexts

export interface RequestContext {
  url: string | null;
  init: RequestInit | null;
  useCache: boolean | null;
  hash: string | null;
  maxAge: number;
  // ---
  request: CancellablePromise<FetchResponse> | null;
  data: FetchResponse["data"] | null;
}

export interface RequestsContext {
  requests: Record<string, StateMachine>;
}

// --------------------------------------------------------
// Events

export interface RequestEvent {
  type: string;
  data: {
    url: string;
    init: RequestInit;
    useCache: boolean;
    hash: string;
  };
  error?: FetchError;
}

export type RequestEvents = {
  type: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "CANCEL" | "RETRY";
  data: RequestEvent;
};

export type RequestsEvents = {
  type: "ADD" | "REMOVE" | "STASH" | "DUMP" | "CANCEL" | "RETRY";
  data: any;
};
