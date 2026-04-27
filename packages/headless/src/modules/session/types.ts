import {
  type IAccount,
  type IClient,
  type ICurrency,
  AccessRoleTypes
} from "@upmind-automation/types";
import type { IPricelist } from "@upmind-automation/types";
import type { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------
/**
 * Interface representing the data for an authenticated session transfer.
 * This is used to securely transfer session context between different parts
 * of an application or between micro-frontends.
 */
export interface IAuthTransfer {
  /**
   * The unique identifier of the client associated with the transfer.
   */
  client_id: IClient["id"];
  /**
   * The one-time transfer code generated for the session.
   */
  code: string;
  /**
   * The type of actor involved in the transfer (e.g. 'client', 'user').
   */
  actor_type: AccessRoleTypes;
  /**
   * The unique identifier of the actor (user or client) performing the transfer.
   */
  actor_id: IClient["id"];
  /**
   * The URL to which the client should be redirected after a successful transfer.
   */
  redirect_url: string;
}

/**
 * Interface representing the details of an active or pending session transfer.
 */
export interface SessionTransfer {
  /**
   * The transfer code used to initiate or identify the session transfer.
   */
  code: string | null;
  /**
   * The redirect URL associated with the transfer, if any.
   */
  redirect: string | null;
  /**
   * An optional authentication token provided as part of the transfer process.
   */
  token?: string | null;
}

/**
 * Interface representing the context for a user session, typically managed by an XState machine.
 * It holds historical states, error information, and details about ongoing session transfers.
 */
export interface SessionContext {
  /**
   * An array of strings representing the historical states of the session machine,
   * useful for debugging or understanding state transitions.
   */
  history?: string[];
  /**
   * An error object if any issue occurred during session management.
   */
  error?: ResponseError;
  // ---
  /**
   * Details about an ongoing or completed session transfer.
   */
  transfer?: SessionTransfer;
}

/**
 * Interface representing an authentication token and its associated metadata.
 * This token is typically used for API authorisation.
 */
export interface Token {
  /**
   * The access token string, used for authenticating API requests.
   */
  access_token: string | null;
  /**
   * The timestamp when the token was created (Unix epoch time), if available.
   */
  created_at?: number | null;
  /**
   * The duration (in seconds) until the access token expires.
   */
  expires_in: number | null;
  /**
   * The duration (in seconds) until the refresh token expires.
   */
  refresh_expires_in: number | null;
  /**
   * The refresh token string, used to get a new access token without re-authentication.
   */
  refresh_token: string | null;
  /**
   * `true` if a second factor (e.g. 2FA code) is required for full authentication.
   */
  second_factor_required: boolean | null;
  /**
   * The origin URL to redirect to after authentication, if specified.
   */
  redirect?: Location["origin"] | null;
  /**
   * The ID of the actor associated with this token.
   */
  actor_id?: string | null;
  /**
   * The type of actor associated with this token (e.g. 'guest', 'client').
   */
  actor_type?: "guest" | "client" | "reseller" | "user" | string | null;
  /**
   * A guest token string, used for non-authenticated sessions.
   */
  guest_token?: string | null;
  /**
   * The 2FA provider type (e.g. 'google', 'sms') returned when `second_factor_required` is true.
   * Sent back in the verify request so the API knows which provider to validate against.
   */
  twofa_provider?: string | null;
}

/**
 * Interface representing the profile and authentication details of an authenticated client.
 */
export interface Client {
  /**
   * The unique identifier of the client.
   */
  id: IClient["id"];
  /**
   * The primary email address of the client.
   */
  email: IClient["email"];

  /**
   * The client's username for login.
   */
  username: IClient["username"];
  /**
   * The client's full name.
   */
  fullName: IClient["fullname"];
  /**
   * The client's first name.
   */
  firstName: IClient["firstname"];
  /**
   * The client's last name.
   */
  lastName: IClient["lastname"];
  /**
   * The client's public name.
   */
  publicName: IClient["public_name"];
  /**
   * The client's preferred language.
   */
  language: IClient["interface_language_id"];
  /**
   * A computed string for displaying the client's name (e.g. "John Doe").
   */
  display: string;
  /**
   * Avatar configuration for the client.
   */
  avatar: {
    /**
     * The caption or initials displayed on the avatar.
     */
    caption: string;
    /**
     * The URL of the user's avatar image.
     */
    src?: string; //IClient["image_url"];
    /**
     * `true` to force the display of the caption even if an image URL is present.
     */
    forceCaption: boolean;
  };
  /**
   * The user's preferred interface language code (e.g. "en-GB").
   */
  locale: IClient["interface_language_code"];

  customFields?: IClient["custom_fields"];

  /**
   * The client's primary email address with verification status.
   */
  primaryEmail?: {
    /**
     * The unique identifier of the email record.
     */
    id: string;
    /**
     * The email address.
     */
    email: string;
    /**
     * `true` if the email has been verified by the client.
     */
    isVerified: boolean;
  };

  /**
   * The client's parsed accounts.
   */
  accounts?: Account[];
}

/**
 * Interface representing a parsed client account.
 */
export interface Account {
  /**
   * The unique identifier of the account.
   */
  id: IAccount["id"];

  /**
   * The account currency.
   */
  currency?: ICurrency;

  /**
   * The account pricelist.
   */
  pricelist?: IPricelist;

  /**
   * Meta flags for the account.
   */
  meta: {
    /**
     * `true` if wallet top-up is enabled for this account.
     */
    canTopup: boolean;
  };
}
