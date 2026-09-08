// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-wallet
 * @description Four-layer contract for the `client-wallet` module headless
 * does not have yet (plan §3): the account-credit read (`useClientWallet` —
 * per-currency balances and the credit limit) and its paged statement
 * collection (`useClientWalletTransactions`). Balances and transactions are
 * the wire `IWalletBalance` / `IWalletTransaction`.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area —
 * `walletBalance.vue`, `statsCurrencyMixin.ts`, the credit-limit panel and
 * the credit statements history; gap-doc rows "3. Billing → Account credit",
 * X8.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  PaginationInfo,
  RequestSortDirection,
  ResponseError,
  useCollection
} from "@upmind-automation/headless";
import type {
  ICurrency,
  IWalletBalance,
  IWalletCurrencyBalance,
  IWalletTransaction,
  WalletTransactionTypes
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * The credit-limit panel's figures for one currency.
 *
 * @decision Portal-local. `IWalletBalance.negative_allowance` is the wire
 * allowance, but no wire model pairs it with the remaining headroom the panel
 * meters; searched `packages/types` for `ICreditLimit` / `ICreditAllowance` /
 * `IWalletCreditLimit` — none exist.
 */
export type WalletCreditLimit = {
  /** The negative balance this client is allowed to run. */
  allowance: IWalletCurrencyBalance;
  /** What is left of that allowance. */
  remaining: IWalletCurrencyBalance;
};

/**
 * What the top-up form is handed — the currencies this client already holds
 * credit in.
 *
 * @decision Plain codes rather than `ICurrency["code"]`: that member is the
 * `ISO_4217_CURRENCY_CODE` ENUM, and every amount in this layer carries its
 * currency as the code alone (`MockMoney.currency`).
 */
export type WalletTopUpContext = {
  currencies: readonly string[];
  /**
   * The stored cards the top-up may be charged to — legacy asked which one
   * funds it (`topUpWalletModal.vue:91-101`). Empty leaves the question
   * unasked: an account with no card on file has nothing to choose.
   */
  methods?: readonly { readonly id: string; readonly label: string }[];
  /** Which card the dialog opens on — the account's default. */
  defaultMethodId?: string;
};

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the wallet READ — whose account credit is read. */
export const ClientWalletContextTypes = {
  /** Reading a client's own account credit. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientWalletContextTypes =
  (typeof ClientWalletContextTypes)[keyof typeof ClientWalletContextTypes];

/**
 * Scope matrix for `useClientWallet`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_WALLET_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientWalletContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientWallet`. */
export type ClientWalletScopeMatrix = typeof CLIENT_WALLET_SCOPE_MATRIX;

/** Context types for the statement COLLECTION — whose statements are read. */
export const ClientWalletTransactionsContextTypes = {
  /** Reading a client's own wallet statements. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientWalletTransactionsContextTypes =
  (typeof ClientWalletTransactionsContextTypes)[keyof typeof ClientWalletTransactionsContextTypes];

/** Scope matrix for `useClientWalletTransactions`. Separate from the read's. */
export const CLIENT_WALLET_TRANSACTIONS_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientWalletTransactionsContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientWalletTransactions`. */
export type ClientWalletTransactionsScopeMatrix =
  typeof CLIENT_WALLET_TRANSACTIONS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the statement list can be sorted by. */
export const ClientWalletTransactionsSortableProperties = {
  DEFAULT: "created_at",
  AMOUNT: "amount",
  DATE_CREATED: "created_at"
} as const;

export type ClientWalletTransactionsSortableProperties =
  (typeof ClientWalletTransactionsSortableProperties)[keyof typeof ClientWalletTransactionsSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The statement collection's named filters — an absent value clears the key. */
export type ClientWalletTransactionsFilters = {
  /** Narrows to one movement type (add, spend, refund, withdraw…). */
  type: (value?: WalletTransactionTypes) => void;
  /** Narrows to one currency — the per-currency wallet table. */
  currencyCode: (value?: ICurrency["code"]) => void;
};

/**
 * The statement collection's named filters — legacy's `FromDateFilter` /
 * `ToDateFilter` (`data/filters/creditStatements.ts`), one per end of the
 * period. An absent value clears the key.
 */
export type ClientWalletStatementsFilters = {
  /** Narrows to periods opening on or after this day. */
  fromDate: (value?: string) => void;
  /** Narrows to periods closing on or before this day. */
  toDate: (value?: string) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientWallet (read)
// -----------------------------------------------------------------------------

/** Wallet context — the per-currency balances and the credit limit. */
export type UseClientWalletContext = {
  /** Every balance bucket this client holds, keyed by currency code. */
  balances: ComputedRef<IWalletBalance | undefined>;
  /** The credit limit, when the brand grants this client one. */
  creditLimit: ComputedRef<WalletCreditLimit | undefined>;
  /** The periods the brand has filed against that limit, newest first. */
  statements: ComputedRef<CreditStatementPeriod[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/** Wallet meta — one computed per state flag. */
export type UseClientWalletMeta = {
  /** True if the read failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this client holds no balance in any currency. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while the brand grants this client a credit limit. */
  hasCreditLimit: ComputedRef<boolean>;
  /** True while this client holds balances in more than one currency. */
  hasMultipleCurrencies: ComputedRef<boolean>;
};

/**
 * One period the brand has closed off and filed — the wire `ICreditStatement`
 * narrowed to what legacy's row printed (`creditStatementRowItem.vue`).
 */
export type CreditStatementPeriod = {
  id: string;
  /** The first day the period covers, inclusive — the wire's `from_date`. */
  fromDate: string;
  /** The last day it covers, inclusive — the wire's `to_date`. */
  toDate: string;
  /** When the desk filed it. */
  createdAt: string;
};

/**
 * A filed statement as a file the browser can save — legacy's `download`
 * action, which fetched the period in one of two types
 * (`creditStatements.ts` store, `download/${type}`).
 */
export type CreditStatementFile = {
  id: CreditStatementPeriod["id"];
  /** What the saved file is called. */
  name: string;
  /** Where to fetch it — the real module answers with the server's own URL. */
  href: string;
};

/** Wallet actions — the top-up write, plus lifecycle. */
export type UseClientWalletActions = {
  /**
   * One filed statement as a saveable file — legacy's `download_csv` entry.
   * The PDF side is the print view the portal opens instead (plan R11), so
   * only the data type the mock can honestly build is published here.
   */
  statementFile: (
    statementId: CreditStatementPeriod["id"]
  ) => Promise<CreditStatementFile | undefined>;
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the wallet is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the wallet from the server. */
  refresh: () => Promise<void>;
  /** Adds credit to one currency's balance, raising a paid invoice for it. */
  topUp: (currencyCode: string, amount: number) => Promise<void>;
};

/** Wallet internals (debugging) — exempt from conformance. */
export type UseClientWalletInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useClientWalletTransactions (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of statements and its lookups. */
export type UseClientWalletTransactionsContext = {
  /** The reactive current page of this scope's statements (always an array). */
  data: ComputedRef<IWalletTransaction[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one statement on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IWalletTransaction>>["findOne"];
  /** Finds one statement on the page by id. */
  getOne: ReturnType<typeof useCollection<IWalletTransaction>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientWalletTransactionsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this scope has no statements. */
  isEmpty: ComputedRef<boolean>;
  /** True while the list is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while there is a further page beyond the current one. */
  hasNextPage: ComputedRef<boolean>;
  /** True while there is a page before the current one. */
  hasPrevPage: ComputedRef<boolean>;
  /** True while the list spans more than one page. */
  hasPages: ComputedRef<boolean>;
};

/** Collection actions — list controls and lifecycle. */
export type UseClientWalletTransactionsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientWalletTransactionsFilters;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the collection is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Fetches the next page. */
  nextPage: () => void;
  /** Fetches the previous page. */
  prevPage: () => void;
  /** Refetches the list from the server. */
  refresh: () => Promise<void>;
  /** Sorts the list by the given property and direction. */
  sort: (
    property?: ClientWalletTransactionsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientWalletTransactionsInternals = ContractInternals;
