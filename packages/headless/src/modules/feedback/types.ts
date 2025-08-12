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
  AUTH = "auth"

  // CONSOLE = "console"
}

export enum messageTypes {
  // DEBUG = "debug",
  ERROR = "error",
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning"
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
  actions?: Array<{
    value: string; // Value to identify the action
    label: string; // Label for the action button
    icon?: string; // Icon to display in the action button
    i18nKey?: string; // i18n key for the action label
    handler?: (context: any) => void | Promise<void>; // Handler function to execute when the action is clicked
  }>;
  // ---
  created?: EpochTimeStamp;
  scheduled?: EpochTimeStamp;
  delay?: number; // Time (ms) to delay showing the alert.
  maxAge?: number; // Time (ms) before alert is auto dismissed. Pass `0` to persist alert.
}

export interface IMessage {
  id: string;
  message: string;
  translations: {
    code: {
      name: string;
    };
  };
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageModel {
  id: IMessage["id"];
  message: IMessage["message"];
  isHidden: IMessage["is_hidden"];
  translations: IMessage["translations"];
}

export interface MessageError {
  type?: number;
  message?: string;
  data?: Record<string, any>;
}

export interface MessagesContext {
  messages: ActorRef<any>[];
}
