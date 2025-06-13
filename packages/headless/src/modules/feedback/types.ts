//  --- external
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------

export enum messageDisplays {
  SILENT = "",
  TOAST = "toast",
  NOTIFICATION = "notification",
  SNACKBAR = "snackbar",
  MODAL = "modal",
  SYSTEM = "system",
  AUTH = "auth",

  // CONSOLE = "console"
}

export enum messageTypes {
  // DEBUG = "debug",
  ERROR = "error",
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
}

export interface Message {
  hash?: string;
  display: messageDisplays;
  type: messageTypes;
  // ---
  i18nKey?: string; // i18n key for the message
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
