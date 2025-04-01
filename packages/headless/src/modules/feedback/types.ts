//  --- external
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------

export enum messageDisplays {
  SILENT = "",
  TOAST = "toast",
  NOTIFICATION = "notification",
  SNACKBAR = "snackbar",
  // CONSOLE = "console"
}

export enum messageTypes {
  // DEBUG = "debug",
  ERROR = "error",
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  // ---
  AUTH = "auth",
  EVENT = "event",
}

export interface Message {
  hash?: string;
  display: messageDisplays;
  type: messageTypes;
  // ---
  title?: string;
  copy?: string;
  data?: any;
  // ---
  created?: EpochTimeStamp;
  scheduled?: EpochTimeStamp;
  delay?: number; // Time (ms) to delay showing the alert.
  maxAge?: number; // Time (ms) before alert is auto dismissed. Pass `0` to persist alert.
}

export interface MessageError {
  type?: number;
  message?: string;
  data?: Record<string, any>;
}

export interface MessagesContext {
  messages: ActorRef<any>[];
}
