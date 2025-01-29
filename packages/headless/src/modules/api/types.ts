// --------------------------------------------------------
// ENUMS

import type { ActorRef } from "xstate";

/**
 * @ignore
 */
export enum responseCodes {
  "OK" = 200,
  "No_Content" = 204,
  "Unauthorized" = 401,
  "Forbidden" = 403,
  "Not_Found" = 404,
  "Conflict" = 409,
  "Too_Many_Requests" = 429,
  "Unprocessable_Entity" = 422,
}

// --------------------------------------------------------
// Request Types

export type FetchResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  // TODO:
  // data: T;
  data: any;
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
  init?: RequestInit;
  useCache?: boolean;
  maxAge?: number;
  data?: any;
  withAccessToken?: boolean;
  hash?: string;
  refresh?: boolean;
}

// --------------------------------------------------------
// Context Types

export interface RequestContext {
  url: URL;
  init: RequestInit;
  useCache: boolean;
  hash: string;
  maxAge: number;
  locale?: string;
  // ---
  created?: EpochTimeStamp;
  completed?: EpochTimeStamp;
  // ---
  attempts?: 0;
  response?: RequestResponse["data"];
  error?: RequestError;
}

export interface RequestsContext {
  requests: Record<string, ActorRef<any>>;
  locale: string | undefined;
}

// --------------------------------------------------------
// Event Types

export interface RequestEvent {
  type: string;
  data: {
    url: URL;
    init: RequestInit;
    useCache: boolean;
    hash: string;
  };
  // TODO:
  // error?: RequestError;
  error?: any;
}

export type RequestEvents = {
  type: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "CANCEL" | "RETRY";
  data: RequestEvent;
};

export type RequestsEvents = {
  type: "ADD" | "REMOVE" | "STASH" | "DUMP" | "CANCEL" | "RETRY";
  data: any;
};
