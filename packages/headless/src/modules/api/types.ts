// --------------------------------------------------------
// ENUMS

import type { ActorRef } from "xstate";

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
  url?: URL;
  init?: RequestInit;
  useCache?: boolean;
  hash?: string;
  maxAge?: number;
  // ---
  created?: EpochTimeStamp;
  completed?: EpochTimeStamp;

  response?: RequestResponse["data"];
  attempts?: number;
  error?: RequestError;
  // TODO:
  // parent?: StateMachine;
  parent?: ActorRef<any, any>;
}

export interface RequestsContext {
  requests: Record<string, ActorRef<any, any>>;
}
