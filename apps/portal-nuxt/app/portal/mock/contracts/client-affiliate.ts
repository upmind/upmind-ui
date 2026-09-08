// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-affiliate
 * @description Four-layer contract for the `client-affiliate` module headless
 * does not have yet (plan §3): the affiliate account and its stats
 * (`useClientAffiliate`, with `enrol()`), the referral links
 * (`useAffiliateLinks`, with `remove(id)`), and the three read-only listings
 * `useAffiliateReferrals`, `useAffiliateCommissions`, `useAffiliatePayouts`.
 * Models are the wire `IAffiliate`, `IAffiliateBalance`, `IAffiliateLink`,
 * `IAffiliateReferral` and `IAffiliateCommission`.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the affiliate
 * enrol screen, stats grid, links table, referrals table and payout history;
 * gap-doc rows "4. Account → Affiliate", X13.
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
  AffiliatePayoutDestinationCode,
  IAffiliate,
  IAffiliateBalance,
  IAffiliateCommission,
  IAffiliateLink,
  IAffiliateReferral,
  ICurrency
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * One row of the payout history — destination, outcome and failure detail.
 *
 * @decision Portal-local. Searched `packages/types` for `IAffiliatePayout`:
 * only `IAffiliatePayoutForm` (the request payload) and
 * `IAffiliatePayoutDestination` exist, neither of which is the history row.
 */
export type AffiliatePayout = {
  /** Identifier for the payout. */
  id: string;
  /** When the payout was requested. */
  createdAt: string;
  /** The amount paid out, in the affiliate's currency. */
  amount: number;
  /** The server-rendered amount — money is never computed downstream. */
  amountFormatted: string;
  /** The currency the payout was made in. */
  currencyCode: ICurrency["code"];
  /** Where the money went. */
  destination: AffiliatePayoutDestinationCode;
  /** The payout's outcome, as the brand's status vocabulary names it. */
  status: string;
  /** The failure detail legacy renders beside a failed payout. */
  error: string | null;
};

/** What the link form writes — legacy's `addEditAffiliateLinkModal` fields. */
/**
 * What the link form is handed — where a NEW link points before the client
 * changes it (`AFFILIATES_DEFAULT_REDIRECT_LINK`, read once to prefill:
 * `addEditAffiliateLinkModal.vue:163-166`), and the brand's own name for the
 * notice standing over the field (`:16-27`).
 */
export type AffiliateLinkContext = {
  /** The brand's default redirect; absent opens the field empty. */
  readonly defaultRedirectUrl?: string;
  /** The brand's own name, for the instruction over the field. */
  readonly brandName: string;
};

export type AffiliateLinkModel = {
  /** Where following the link lands. */
  redirectUrl: IAffiliateLink["redirect_url"];
  /** The client's own name for it. */
  name?: IAffiliateLink["name"];
};

/** What the withdrawal form writes — legacy asked for a message and nothing else. */
export type AffiliateWithdrawalModel = {
  message: string;
};

/** What the payout-destination form writes. */
export type AffiliatePayoutDestinationModel = {
  /** Where withdrawals are sent; absent follows the brand's own default. */
  code?: AffiliatePayoutDestinationCode;
  /** Which of the client's emails PayPal pays — asked for by that code alone. */
  paypalEmail?: string;
};

/** What the payout-destination schema is handed. */
export type AffiliatePayoutDestinationContext = {
  /** The destinations the brand settles through. */
  readonly destinations: readonly AffiliatePayoutDestinationCode[];
  /** The client's own email addresses — legacy's PayPal picker read the same list. */
  readonly emails: readonly string[];
  /** The destination on file. */
  readonly model: AffiliatePayoutDestinationModel;
};

// -----------------------------------------------------------------------------
// SCOPE — one matrix per composable
// -----------------------------------------------------------------------------

/** Context types for the affiliate ACCOUNT — whose account is read. */
export const ClientAffiliateContextTypes = {
  /** Reading a client's own affiliate account. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientAffiliateContextTypes =
  (typeof ClientAffiliateContextTypes)[keyof typeof ClientAffiliateContextTypes];

/**
 * Scope matrix for `useClientAffiliate` and the four affiliate listings.
 * `client` is the only actor that resolves; the portal mock has no staff or
 * guest surface (plan §6).
 */
export const CLIENT_AFFILIATE_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientAffiliateContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for the affiliate module. */
export type ClientAffiliateScopeMatrix = typeof CLIENT_AFFILIATE_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the links table can be sorted by. */
export const AffiliateLinksSortableProperties = {
  DEFAULT: "created_at",
  DATE_CREATED: "created_at",
  NAME: "name",
  VISITS: "visit_count"
} as const;

export type AffiliateLinksSortableProperties =
  (typeof AffiliateLinksSortableProperties)[keyof typeof AffiliateLinksSortableProperties];

/** Wire columns the referrals table can be sorted by. */
export const AffiliateReferralsSortableProperties = {
  DEFAULT: "created_at",
  DATE_CREATED: "created_at"
} as const;

export type AffiliateReferralsSortableProperties =
  (typeof AffiliateReferralsSortableProperties)[keyof typeof AffiliateReferralsSortableProperties];

/** Wire columns the commissions table can be sorted by. */
export const AffiliateCommissionsSortableProperties = {
  DEFAULT: "created_at",
  AMOUNT: "amount",
  DATE_CREATED: "created_at"
} as const;

export type AffiliateCommissionsSortableProperties =
  (typeof AffiliateCommissionsSortableProperties)[keyof typeof AffiliateCommissionsSortableProperties];

/** Columns the payout history can be sorted by. */
export const AffiliatePayoutsSortableProperties = {
  DEFAULT: "created_at",
  AMOUNT: "amount",
  DATE_CREATED: "created_at"
} as const;

export type AffiliatePayoutsSortableProperties =
  (typeof AffiliatePayoutsSortableProperties)[keyof typeof AffiliatePayoutsSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/**
 * The links table's named filters — an absent value clears that key. Legacy's
 * own set (`data/filters/affiliate.ts:6-34`) beside the free-text one: the
 * two counts and the day the link was made.
 */
export type AffiliateLinksFilters = {
  /** Free-text narrowing over link name and redirect. */
  query: (value?: string) => void;
  /** Narrows to a band of visit counts. */
  visits: (value?: string) => void;
  /** Narrows to a band of referral counts. */
  referrals: (value?: string) => void;
  /** Narrows by the day the link was made. */
  dateCreated: (value?: IAffiliateLink["created_at"]) => void;
};

/** The referrals table's named filters. */
export type AffiliateReferralsFilters = {
  /** Narrows to the referrals one link brought in. */
  linkId: (value?: IAffiliateLink["id"]) => void;
  /** Narrows by referral date. */
  dateCreated: (value?: IAffiliateReferral["created_at"]) => void;
};

/**
 * The commissions table's named filters — legacy's own set, which is ONE
 * filter: `AffiliateCommissionsFilters` in `data/filters/affiliate.ts`
 * publishes `created_at` and nothing else, and the table it feeds
 * (`commissionsHistoryTable.vue:194`) draws Amount, Item and Date created.
 *
 * A `paid` narrowing was declared here and never landed: the wire's
 * `IAffiliateCommission` carries the field, but a client's own commissions
 * table never offered it, so the setter answered no caller and no row shape
 * could have answered it either. Withdrawn rather than invented.
 */
export type AffiliateCommissionsFilters = {
  /**
   * Narrows by the day it was earned — legacy's own created filter
   * (`data/filters/affiliate.ts`, `AffiliateCommissionsFilters`).
   */
  dateCreated: (value?: string) => void;
};

/** The payout history's named filters. */
/**
 * The payout history's named filters — legacy's own set, which is ONE filter:
 * `AffiliatePayoutFilters` in `data/filters/affiliate.ts` publishes
 * `created_at` (labelled "date paid") and nothing else.
 *
 * A `destination` narrowing was declared here and never landed — the client's
 * own payout table never offered it, so the setter answered no caller.
 * Withdrawn rather than invented, as the commissions' `paid` was.
 */
export type AffiliatePayoutsFilters = {
  /**
   * Narrows by the day it settled — legacy's own paid filter
   * (`payoutsHistoryTable.vue:10-16`).
   */
  datePaid: (value?: string) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientAffiliate (account)
// -----------------------------------------------------------------------------

/** Account context — the affiliate record and its balances. */
export type UseClientAffiliateContext = {
  /** The affiliate account this client holds, when enrolled. */
  data: ComputedRef<IAffiliate | undefined>;
  /** The pending, available, suspended and withdrawn balances. */
  balances: ComputedRef<IAffiliateBalance | undefined>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/** Account meta — one computed per state flag. */
export type UseClientAffiliateMeta = {
  /** True if the read or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this client holds no affiliate account. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while a mutation is in flight. */
  isProcessing: ComputedRef<boolean>;
  /** True once the client has joined the programme. */
  isEnrolled: ComputedRef<boolean>;
  /** True while the brand has suspended this affiliate account. */
  isDisabled: ComputedRef<boolean>;
};

/** Account actions — joining, withdrawing, choosing a destination, plus lifecycle. */
export type UseClientAffiliateActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the account is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the account from the server. */
  refresh: () => Promise<void>;
  /** Joins the affiliate programme. */
  enrol: () => Promise<void>;
  /** Asks for the available balance to be paid out. */
  requestWithdrawal: (model: AffiliateWithdrawalModel) => Promise<void>;
  /** Chooses where withdrawals are sent. */
  savePayoutDestination: (
    model: AffiliatePayoutDestinationModel
  ) => Promise<void>;
};

/** Account internals (debugging) — exempt from conformance. */
export type UseClientAffiliateInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useAffiliateLinks (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of referral links. */
export type UseAffiliateLinksContext = {
  /** The reactive current page of this affiliate's links (always an array). */
  data: ComputedRef<IAffiliateLink[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one link on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IAffiliateLink>>["findOne"];
  /** Finds one link on the page by id. */
  getOne: ReturnType<typeof useCollection<IAffiliateLink>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseAffiliateLinksMeta = {
  /** True if the list query or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this affiliate has no links. */
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

/** Collection actions — list controls, the three link verbs, and lifecycle. */
export type UseAffiliateLinksActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: AffiliateLinksFilters;
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
    property?: AffiliateLinksSortableProperties,
    direction?: RequestSortDirection
  ) => void;
  /** Mints one referral link, resolving the link the server recorded. */
  create: (model: AffiliateLinkModel) => Promise<IAffiliateLink | undefined>;
  /** Renames one, or re-points it. */
  update: (
    id: IAffiliateLink["id"],
    model: AffiliateLinkModel
  ) => Promise<IAffiliateLink | undefined>;
  /** Deletes one referral link. */
  remove: (id: IAffiliateLink["id"]) => Promise<void>;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseAffiliateLinksInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useAffiliateReferrals (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of referrals. */
export type UseAffiliateReferralsContext = {
  /** The reactive current page of this affiliate's referrals. */
  data: ComputedRef<IAffiliateReferral[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one referral on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IAffiliateReferral>>["findOne"];
  /** Finds one referral on the page by id. */
  getOne: ReturnType<typeof useCollection<IAffiliateReferral>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseAffiliateReferralsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this affiliate has referred nobody. */
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
export type UseAffiliateReferralsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: AffiliateReferralsFilters;
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
    property?: AffiliateReferralsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseAffiliateReferralsInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useAffiliateCommissions (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of commission rows. */
export type UseAffiliateCommissionsContext = {
  /** The reactive current page of this affiliate's commission. */
  data: ComputedRef<IAffiliateCommission[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one commission row on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IAffiliateCommission>>["findOne"];
  /** Finds one commission row on the page by id. */
  getOne: ReturnType<typeof useCollection<IAffiliateCommission>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseAffiliateCommissionsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this affiliate has earned nothing. */
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
export type UseAffiliateCommissionsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: AffiliateCommissionsFilters;
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
    property?: AffiliateCommissionsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseAffiliateCommissionsInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useAffiliatePayouts (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of payout history. */
export type UseAffiliatePayoutsContext = {
  /** The reactive current page of this affiliate's payouts. */
  data: ComputedRef<AffiliatePayout[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one payout on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<AffiliatePayout>>["findOne"];
  /** Finds one payout on the page by id. */
  getOne: ReturnType<typeof useCollection<AffiliatePayout>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseAffiliatePayoutsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this affiliate has never been paid out. */
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
export type UseAffiliatePayoutsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: AffiliatePayoutsFilters;
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
    property?: AffiliatePayoutsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseAffiliatePayoutsInternals = ContractInternals;
