import type { Url } from "url";
import type { StateMachine } from "xstate";

// --------------------------------------------------------
// ENUMS
export enum responseCodes {
  200 = "OK",
  204 = "No Content",
  401 = "Unauthorized",
  403 = "Forbidden",
  404 = "Not Found",
  409 = "Conflict",
  429 = "Too Many Requests"
}

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
  url: Url;
  init?: RequestInit | null;
  useCache?: boolean | null;
  maxAge?: number | null;
  data?: any;
  withAccessToken?: boolean;
}

// --------------------------------------------------------
// Context Types

export interface RequestContext {
  url: Url | null;
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
