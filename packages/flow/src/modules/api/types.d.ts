import type { StateMachine } from "xstate";

// --------------------------------------------------------
// ENUMS
export enum responseCodes {
  "OK" = 200,
  "No_Content" = 204,
  "Unauthorized" = 401,
  "Forbidden" = 403,
  "Not_Found" = 404,
  "Conflict" = 409,
  "Too_Many_Requests" = 429,
}

// --------------------------------------------------------
// Request Types

export type FetchResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  data: T;
};

export interface RequestResponse {
  data: {
    status: Response["status"];
    data: any;
  };
}

export interface RequestError {
  status?: number;
  message?: string;
  data?: Record<string, any>;
}

export interface RequestParams {
  url: URL;
  init?: RequestInit | null;
  useCache?: boolean | null;
  maxAge?: number | null;
  data?: any;
  withAccessToken?: boolean;
  hash?: string;
  refresh?: boolean;
}

// --------------------------------------------------------
// Context Types

export interface RequestContext {
  url: URL | null;
  init: RequestInit | null;
  useCache: boolean | null;
  hash: string | null;
  maxAge: number;
  // ---
  created: null | EpochTimeStamp;
  completed: null | EpochTimeStamp;

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
    url: Url;
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
