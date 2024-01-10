import type { StateMachine } from "xstate";

// --------------------------------------------------------
// ENUMS
export enum messageDisplays {
  TOAST = "toast",
  NOTIFICATION = "notification",
  SNACKBAR = "snackbar"
  // CONSOLE = "console"
}

export enum messageTypes {
  // DEBUG = "debug",
  ERROR = "error",
  INFO = "info",
  NEUTRAL = "neutral",
  PRIMARY = "primary",
  SECONDARY = "secondary",
  SUCCESS = "success",
  WARNING = "warning"
}

interface Message {
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
// --------------------------------------------------------
// Context

export interface MessagesContext {
  messages: Array[StateMachine];
}

// --------------------------------------------------------
// Event Types

export interface MessageEvent {
  display: string;
  data: Message;
  error?: MessageError;
}

export type MessagesEvents = {
  display: "ADD" | "REMOVE";
  data: Message;
};
