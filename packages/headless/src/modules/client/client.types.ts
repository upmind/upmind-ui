/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/types
 * @description Auth module type definitions.
 * Includes auth machine types (from @next-legacy verbatim) plus the Client and
 * Account interfaces relocated from session/types.ts (M7 — FE-2826).
 */

import type {
  DaysOfWeekTypes,
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import type {
  IAccount,
  IClient,
  ICurrency,
  IPricelist
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------

/**
 * The client record view-model produced by the one mapper, `mapClientRecord`.
 * Each sibling client module owns its own `clients/{id}` request and passes
 * the raw record through this one mapper, then reads only its own fields:
 * `client-billing-settings` requests `with=accounts,accounts.currency` and
 * reads `account`; `client-personal-details` requests
 * `with=custom_fields,custom_fields.field` and reads `customFieldValues`.
 * The mapper maps `account` from the first of `raw.accounts` (`null` when
 * absent, never `undefined`) and `customFieldValues` from `raw.custom_fields`
 * (an empty array when absent). A field a module does not request is absent
 * from the mapped record — the module reads only the slice its request loads.
 */
export type ClientRecord = {
  /** Unique identifier of the client. */
  id: IClient["id"];
  /** The client's brand id. */
  brandId: IClient["brand_id"];
  /** Client's first name. */
  firstName: IClient["firstname"];
  /** Client's last name. */
  lastName: IClient["lastname"];
  /** Client's public name. */
  publicName: IClient["public_name"];
  /** Interface language id (the model's identity for the language field). */
  language: IClient["interface_language_id"];
  /** Interface language code (e.g. "en-GB"). */
  interfaceLanguageCode: IClient["interface_language_code"];
  /** `true`/`false` from the products-exclude-delegates UI meta, or `undefined` when unset. */
  excludeDelegatedProducts?: boolean;
  /** The client's own custom-field values, verbatim off the record. */
  customFieldValues: NonNullable<IClient["custom_fields"]>;
  /** Invoice-consolidation switch. */
  enabled: InvoiceConsolidationTypes;
  /** Consolidation base rule, or `null` to follow the brand. */
  baseRule: InvoiceConsolidationRuleTypes | null;
  /** Weekly consolidation day, or `null` to follow the brand. */
  dayOfWeek: DaysOfWeekTypes | null;
  /** Monthly consolidation day, or `null` to follow the brand. */
  dateOfMonthDay: number | null;
  /** Consolidated-invoice due-date day, or `null` to follow the brand. */
  dueDateDay: number | null;
  /** The client's `never_suspend` flag. */
  neverSuspend: boolean;
  /** The raw UI meta bag — a profile save must merge the other keys back in. */
  meta: IClient["meta"];
  /** The client's primary account (with `currency`), or `null` when the client has none. */
  account: Account | null;
};

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
