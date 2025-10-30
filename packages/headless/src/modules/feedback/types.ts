//  --- external
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------

/**
 * Enumeration defining the various display methods for messages within the UI.
 * This dictates how and where a message (e.g. error, success notification) will be presented to the user.
 *
 * @enum {string}
 */
export enum messageDisplays {
  /**
   * Message is not displayed visually. This can be used for logging or internal processing only.
   */
  SILENT = "",
  /**
   * Message displayed as a temporary "toast" notification, usually appearing at the top or bottom of the screen.
   */
  TOAST = "toast",
  /**
   * Message displayed as a more persistent "notification", often in a dedicated notification area or sidebar.
   */
  NOTIFICATION = "notification",
  /**
   * Message displayed as a "snackbar", a brief, non-intrusive message bar at the bottom of the screen.
   */
  SNACKBAR = "snackbar",
  /**
   * Message displayed within a "modal" dialogue, requiring user interaction to dismiss.
   */
  MODAL = "modal",
  /**
   * Message displayed as a "interstitial" dialogue, requiring user interaction to dismiss.
   */
  INTERSTITIAL = "interstitial",
  /**
   * Message specifically related to authentication (e.g. login, registration) flows.
   */
  AUTH = "auth"
}

/**
 * Enumeration defining the different types of messages based on their severity or purpose.
 * This is used for styling and categorisation of alerts.
 *
 * @enum {string}
 */
export enum messageTypes {
  /**
   * An error message, indicating a critical issue or failure.
   */
  ERROR = "error",
  /**
   * An informational message, providing general updates or context.
   */
  INFO = "info",
  /**
   * A success message, confirming that an operation completed successfully.
   */
  SUCCESS = "success",
  /**
   * A warning message, indicating a potential issue that may require attention but is not critical.
   */
  WARNING = "warning"
}

/**
 * Interface representing a client-side message object for display in the UI.
 * It contains content, display preferences, and optional actions.
 */
export interface Message {
  /**
   * An optional hash to uniquely identify and deduplicate messages.
   */
  hash?: string;
  /**
   * The {@link messageDisplays} type dictating how the message should be presented.
   */
  display: messageDisplays;
  /**
   * The {@link messageTypes} type indicating the severity or purpose of the message.
   */
  type: messageTypes;
  /**
   * The title of the message.
   */
  title?: string;
  /**
   * The main content or body copy of the message.
   */
  copy?: string;
  /**
   * Optional additional data associated with the message, e.g. an error object.
   */
  data?: any;
  /**
   * An array of actionable buttons or links to display with the message.
   */
  actions?: Array<{
    /**
     * A unique value to identify the action when it's triggered.
     */
    value: string;
    /**
     * The label text for the action button.
     */
    label: string;
    /**
     * An optional icon to display in the action button.
     */
    icon?: string;
    /**
     * A handler function to execute when the action is clicked.
     * @param context - The context in which the action is handled.
     * @returns A promise or `void`.
     */
    handler?: (context: any) => void | Promise<void>;
  }>;
  /**
   * The timestamp when the message was created (Unix epoch time).
   */
  created?: EpochTimeStamp;
  /**
   * The timestamp when the message is scheduled to be displayed (Unix epoch time).
   */
  scheduled?: EpochTimeStamp;
  /**
   * The time in milliseconds to delay before showing the alert.
   */
  delay?: number;
  /**
   * The time in milliseconds before the alert is automatically dismissed.
   * Pass `0` to make the alert persist indefinitely.
   */
  maxAge?: number;
}

/**
 * Interface representing a message object as typically retrieved from a backend API.
 * This includes unique identifiers, content, and translation metadata.
 */
export interface IMessage {
  /**
   * The unique identifier of the message.
   */
  id: string;
  /**
   * The message content string.
   */
  message: string;
  /**
   * Translation metadata for the message, including locale codes and names.
   */
  translations: {
    /**
     * An object where keys are locale codes and values contain translated names.
     */
    code: {
      /** The translated name of the message for the given locale. */
      name: string;
    };
  };
  /**
   * `true` if the message is hidden from display.
   */
  is_hidden: boolean;
  /**
   * The timestamp when the message was created.
   */
  created_at: string;
  /**
   * The timestamp when the message was last updated.
   */
  updated_at: string;
}

/**
 * Interface representing a client-side model for an {@link IMessage},
 * simplifying the structure for UI consumption.
 */
export interface MessageModel {
  /**
   * The unique identifier of the message.
   */
  id: IMessage["id"];
  /**
   * The message content.
   */
  message: IMessage["message"];
  /**
   * `true` if the message is hidden.
   */
  isHidden: IMessage["is_hidden"];
  /**
   * Translation metadata for the message.
   */
  translations: IMessage["translations"];
}

/**
 * Interface representing a structured error object, typically used for displaying
 * error messages from API responses or internal validation.
 */
export interface MessageError {
  /**
   * An optional numeric type code for the error.
   */
  type?: number;
  /**
   * The error message string.
   */
  message?: string;
  /**
   * Optional additional data related to the error, e.g. validation specifics.
   */
  data?: Record<string, any>;
}

/**
 * Interface representing the context for a message management system,
 * typically managed by an XState machine. It holds references to active message actors.
 */
export interface MessagesContext {
  /**
   * An array of `ActorRef`s, each pointing to an XState actor managing an individual message's lifecycle.
   */
  messages: ActorRef<any>[];
}
