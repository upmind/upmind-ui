/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/types
 * @description Auth module type definitions.
 * Includes auth machine types (from @next-legacy verbatim) plus the Client and
 * Account interfaces relocated from session/types.ts (M7 — FE-2826).
 */

import type {
  IAccount,
  IClient,
  ICurrency,
  IPricelist
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Client / Account types — relocated from session/types.ts (M7, FE-2826).
// The single isGuest mapper is session-store/session-store.mappers.ts
// mapSessionUser (F5) — auth.mappers.mapClient does NOT carry isGuest.

/**
 * Profile and authentication details of an authenticated client.
 */
export type Client = {
  /** Unique identifier of the client. */
  id: IClient["id"];
  /** Primary email address of the client. */
  email: IClient["email"];
  /**
   * Whether the client is a guest.
   * Populated by session-store mapSessionUser ONLY (F5 — single isGuest mapper).
   * auth.mappers.mapClient does NOT set this field.
   */
  isGuest?: boolean;
  /** Client's username for login. */
  username: IClient["username"];
  /** Client's full name. */
  fullName: IClient["fullname"];
  /** Client's first name. */
  firstName: IClient["firstname"];
  /** Client's last name. */
  lastName: IClient["lastname"];
  /** Client's public name. */
  publicName: IClient["public_name"];
  /** Client's preferred language. */
  language: IClient["interface_language_id"];
  /** Computed display name. */
  display: string;
  /** Avatar configuration. */
  avatar: {
    /** Initials or caption displayed on the avatar. */
    caption: string;
    /** URL of the avatar image. */
    src?: string;
    /** Force caption display even when an image URL is present. */
    forceCaption: boolean;
  };
  /** Interface language code (e.g. "en-GB"). */
  locale: IClient["interface_language_code"];
  /** Custom fields from brand configuration. */
  customFields?: IClient["custom_fields"];
  /**
   * Primary email with verification status.
   * Populated by mapSessionUser from actor.default_email (M1/M6/M7).
   */
  primaryEmail?: {
    /** Unique identifier of the email record. */
    id: string;
    /** Email address. */
    email: string;
    /** True if the email has been verified. */
    isVerified: boolean;
  };
  /** Parsed client accounts. */
  accounts?: Account[];
};

/**
 * Parsed client account.
 */
export type Account = {
  /** Unique identifier of the account. */
  id: IAccount["id"];
  /** Account currency (relation — only present when loaded with `currency`). */
  currency?: ICurrency;
  /** Account currency id (always present on the account). */
  currencyId: IAccount["currency_id"];
  /** Preferred payment currency id, when the client has set one. */
  preferredPaymentCurrencyId: IAccount["preferred_payment_currency_id"];
  /** Account pricelist. */
  pricelist?: IPricelist;
  /** Meta flags for the account. */
  meta: {
    /** True if wallet top-up is enabled. */
    canTopup: boolean;
  };
};
