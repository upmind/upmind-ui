import type { StateMachine } from "xstate";

// --------------------------------------------------------
// ENUMS
export enum messageDisplays {
  TOAST = "toast",
  NOTIFICATION = "notification"
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
  subtitle?: string;
  copy?: string;
  icon?: string;
  // ---
  created?: EpochTimeStamp;
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
  messages: Record<string, StateMachine>;
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
