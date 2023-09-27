import type { StateMachine } from "xstate";

// --------------------------------------------------------
// Contexts

export interface SessionContext {
  url: string | null;
  init: SessionInit | null;
  useCache: boolean | null;
  hash: string | null;
  maxAge: number;
  // ---
  data: RequestResponse["data"] | null;
}

export interface SessionsContext {
  requests: Record<string, StateMachine>;
}

// --------------------------------------------------------
// Events

export interface SessionEvent {
  type: string;
  data: {
    url: string;
    init: SessionInit;
    useCache: boolean;
    hash: string;
  };
  error?: RequestError;
}

export type SessionEvents = {
  type: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "CANCEL" | "RETRY";
  data: SessionEvent;
};

export type SessionsEvents = {
  type: "ADD" | "REMOVE" | "STASH" | "DUMP" | "CANCEL" | "RETRY";
  data: any;
};
