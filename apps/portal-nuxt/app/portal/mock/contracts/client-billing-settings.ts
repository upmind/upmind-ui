// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-billing-settings
 * @description Four-layer contract for the `client-billing-settings` module
 * headless does not have yet (plan §3): how this client is billed — the
 * currency they are quoted in, the currency they pay in where the brand
 * offers a choice, the price list they buy from, and whether their invoices
 * are consolidated into one.
 *
 * @decision Portal-local models. The wire carries these as loose members of
 * `IClient` and as brand config values, and no request model pairs them;
 * searched `packages/types` for `IClientBillingSettings` /
 * `IInvoiceConsolidation` — neither exists.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area —
 * `clientBillingBasicConfigurationForm.vue`,
 * `clientInvoiceConsolidationForm.vue`; gap-doc rows "3. Billing → Billing
 * settings (stub)".
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  ResponseError
} from "@upmind-automation/headless";
import type {
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * One price list the brand publishes — what a client may be quoted from.
 *
 * @decision The currency is a plain code rather than `ICurrency["code"]`:
 * that member is the `ISO_4217_CURRENCY_CODE` ENUM, and every amount in this
 * layer carries its currency as the code alone (`MockMoney.currency`), so a
 * contract demanding the enum could not be satisfied by any seeded row.
 */
export type BillingPriceList = {
  id: string;
  name: string;
  /** The currency its prices are held in. */
  currencyCode: string;
};

/**
 * When the consolidated invoice is raised. The rule is the platform's own;
 * which day member it reads is the rule's to say, so all three ride together
 * and only one applies at a time.
 */
export type InvoiceConsolidationRule = {
  rule?: InvoiceConsolidationRuleTypes;
  /** The day a weekly rule falls on. */
  dayOfWeek?: string;
  /** The day of the month a monthly rule falls on. */
  dayOfMonth?: number;
  /** How many days after it is raised the consolidated invoice falls due. */
  dueDateDay?: number;
};

/** The client's billing preferences, as the settings page reads them. */
export type BillingSettings = InvoiceConsolidationRule & {
  /** The currency this client is quoted in (see `BillingPriceList`). */
  currencyCode: string;
  /** The currency this client pays in; absent falls back to the quoted one. */
  paymentCurrencyCode?: string;
  priceListId?: BillingPriceList["id"];
  consolidation: InvoiceConsolidationTypes;
};

/** What the settings form is handed — the lookups its pickers offer, and the row it opens on. */
export type BillingSettingsContext = {
  /** The currencies the brand trades in. */
  currencies: readonly string[];
  /** The currencies a client may pay in; absent where the brand offers no choice. */
  paymentCurrencies?: readonly string[];
  /** The price lists this client may be quoted from. */
  priceLists: readonly BillingPriceList[];
  /** The settings on file. */
  model: BillingSettings;
  /**
   * When the BRAND itself raises the consolidated invoice, in words — what a
   * client following it is following. Absent where the brand publishes no
   * schedule to follow.
   */
  brandSchedule?: string;
};

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/** Context types for the settings read — whose billing preferences are addressed. */
export const ClientBillingSettingsContextTypes = {
  /** Acting on a client's own billing preferences. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientBillingSettingsContextTypes =
  (typeof ClientBillingSettingsContextTypes)[keyof typeof ClientBillingSettingsContextTypes];

/**
 * Scope matrix for `useClientBillingSettings`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_BILLING_SETTINGS_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientBillingSettingsContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientBillingSettings`. */
export type ClientBillingSettingsScopeMatrix =
  typeof CLIENT_BILLING_SETTINGS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// LAYERS — useClientBillingSettings
// -----------------------------------------------------------------------------

/** Settings context — the preferences on file and the lookups behind them. */
export type UseClientBillingSettingsContext = {
  /** The billing preferences this scope resolved. */
  data: ComputedRef<BillingSettings | undefined>;
  /** The price lists this client may be quoted from. */
  priceLists: ComputedRef<BillingPriceList[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/** Settings meta — one computed per state flag. */
export type UseClientBillingSettingsMeta = {
  /** True if the read or a write failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this scope resolved no preferences at all. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while a write is in flight. */
  isProcessing: ComputedRef<boolean>;
  /** True while the brand lets this client pay in another currency. */
  hasPaymentCurrencyChoice: ComputedRef<boolean>;
  /** True while there is more than one price list to be quoted from. */
  hasPriceListChoice: ComputedRef<boolean>;
  /** True while this client's invoices are consolidated. */
  isConsolidated: ComputedRef<boolean>;
};

/** Settings actions — the one write, plus lifecycle. */
export type UseClientBillingSettingsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the preferences can be read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the preferences from the server. */
  refresh: () => Promise<void>;
  /** Saves the whole settings form — currency, price list and consolidation together. */
  save: (model: BillingSettings) => Promise<void>;
};

/** Settings internals (debugging) — exempt from conformance. */
export type UseClientBillingSettingsInternals = ContractInternals;
