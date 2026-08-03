import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { IEmail } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------
/**
 * Context types for the client-emails **collection** — the entity whose email
 * list is being read. Staff read on behalf of a client; a client reads their own
 * (or a child client's) list.
 */
export enum ClientEmailsContextTypes {
  /** Acting on a client's email collection. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Scope matrix for `useClientEmails` (collection). Mirrors the account arc:
 * - staff / client: can address a `client` collection
 * - self / guest: not a valid collection scope
 */
export const CLIENT_EMAILS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: ClientEmailsContextTypes.CLIENT,
  [ScopeActorTypes.CLIENT]: ClientEmailsContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientEmails` (derived from the runtime const). */
export type ClientEmailsScopeMatrix = typeof CLIENT_EMAILS_SCOPE_MATRIX;

/**
 * Context types for the client-email **manager** — the specific email being
 * edited. The manager is scoped per-email so concurrent edit forms get isolated
 * instances; a new email is minted with `.fresh()` (no context).
 */
export enum ClientEmailContextTypes {
  /** Editing a specific email by id. */
  EMAIL = "email"
}

/**
 * Scope matrix for `useClientEmailManager` (per-email form).
 * - staff / client: can edit a specific `email`
 * - self / guest: no email-scoped edit context (new-email default only)
 */
export const CLIENT_EMAIL_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: ClientEmailContextTypes.EMAIL,
  [ScopeActorTypes.CLIENT]: ClientEmailContextTypes.EMAIL,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientEmailManager` (derived from the runtime const). */
export type ClientEmailScopeMatrix = typeof CLIENT_EMAIL_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
/**
 * An array of predefined email types, used for categorising different kinds of email addresses.
 */
export const EmailTypes = [{ key: 1, value: "Account" }];

/**
 * Interface representing the data model for an email address, suitable for forms
 * or API payloads.
 */
export interface EmailModel {
  /**
   * Optional unique identifier for the email address. Present if editing an existing email.
   */
  id?: IEmail["id"];
  /**
   * The email address string, or `null` if not set.
   */
  email: IEmail["email"] | null;
}

/**
 * Interface representing a comprehensive email object, extending {@link EmailModel}
 * with additional identifiers, computed display fields, and meta-data about its status.
 * This is typically used for email addresses retrieved from the API or displayed in the UI.
 */
export interface Email extends EmailModel {
  //--- computed details
  /**
   * A display title for the email address (e.g. "Account Email").
   */
  title: string;
  /**
   * A detailed description of the email address.
   */
  description: string;
  /**
   * The type of email address, corresponding to keys in {@link EmailTypes} (e.g. 1 for "Account").
   */
  type: IEmail["type"];
  /**
   * A timestamp indicating when the email address last bounced.
   */
  bouncedAt?: {
    date?: string | null;
    relative?: string | null;
  };
  // --- meta info
  /**
   * Meta-information about the email address's status and capabilities.
   */
  meta: {
    /**
     * `true` if this is the client's default email address.
     */
    isDefault: boolean;
    /**
     * `true` if the client can delete the email address.
     */
    canDelete: boolean;
    /**
     * `true` if the email address has been verified.
     */
    isVerified: boolean;
    /**
     * `true` if the email address has been bounced.
     */
    isBounced: boolean;
  };
}

/**
 * Interface representing the context for email management within a client item context.
 * It extends `DataManagerContext` with specific data relevant to email operations.
 *
 * @template TModel - The type of the email model, typically {@link EmailModel}.
 */
export type EmailContext = DataManagerContext<EmailModel>;
