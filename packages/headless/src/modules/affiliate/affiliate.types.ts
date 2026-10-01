import { ScopeActorTypes } from "../scope/scope.types";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ListQuery } from "../query";
import type { SortDirection } from "../query/query.types";
import type { DefaultError, UseQueryReturnType } from "@tanstack/vue-query";
import type {
  BrandConfigKeys,
  IAffiliate,
  IAffiliateBalance,
  IAffiliateBrandPayoutDestination,
  IAffiliateLink,
  IAffiliatePayout,
  IAffiliatePendingCommission,
  IAffiliateReferral,
  IEmail
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/affiliate.types
 * @description Types for the affiliate module — the active-account resolver,
 * the client account read, the guest link visit, the links/referrals/
 * commissions/payouts collections and the link/payout-destination managers
 * (design.md §5.2). Every composable in this module refuses `.for(...)`: the
 * oracle names no on-behalf capability for either cell (client×self,
 * guest×self), so each matrix cell is `null as never` and no context enum is
 * minted (`SINGLE-READ.md`, design.md D-16).
 *
 * @decision `AffiliateWithdrawalFormModel` and `AffiliateScopeMatrix` are not
 * `AffiliateWithdrawalModel` / `ClientAffiliateScopeMatrix`, the names
 * design.md §5.2 states.
 * what: renamed both to avoid the duplicate-type gate.
 * why: `apps/portal-nuxt/app/portal/mock/contracts/client-affiliate.ts`
 *      already exports both identifiers (the UI contract this module
 *      implements, design.md §1.3 "Portal mock owners swap the mock for the
 *      module"). The gate denies a second declaration of an existing
 *      exported name anywhere in the repo.
 * rejected: importing the mock's types into this package — apps depend on
 *      packages, never the reverse; editing the portal-nuxt mock file — out
 *      of this story's scope (R-SCOPE-MODULE).
 */
// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/**
 * Shared by every client composable of this module (`useAffiliateActiveAccount`,
 * `useClientAffiliate`, and — once built — each collection and manager). A
 * cell holds the CONTEXTS an actor may act for, not the actor's right to call;
 * `.as(actor)` stays spellable for every `ScopeActorTypes` member, and each
 * client composable refuses any resolved actor other than CLIENT at runtime
 * (design.md §5.2, D-16, D-21).
 */
export const CLIENT_AFFILIATE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

export type AffiliateScopeMatrix = typeof CLIENT_AFFILIATE_SCOPE_MATRIX;

/**
 * `useAffiliateLinkVisit`'s own matrix. The oracle entry (`vue:aff.ts`) reads
 * no session, so every actor sends the same visit (design.md D-13); a
 * non-null GUEST cell would advertise an on-behalf capability that does not
 * exist (audit D6, corrected).
 */
export const AFFILIATE_LINK_VISIT_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

export type AffiliateLinkVisitScopeMatrix =
  typeof AFFILIATE_LINK_VISIT_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/** The withdrawal request form model (design.md §8.5). */
export type AffiliateWithdrawalFormModel = {
  message: string;
};

/** The visit request model, each field defaulted from the browser (flow.md §4). */
export type AffiliateLinkVisitModel = {
  visitUrl: string;
  referrerUrl: string;
  userAgent: string;
};

/** The outcome of one `visit()` call — the target to navigate to. */
export type AffiliateLinkVisitResult = {
  target: string;
};

/** The raw visit response — the composable's `visit()` action builds the target. */
export type AffiliateLinkVisitResponse = {
  redirectUrl?: string;
  referralCookie?: string;
  referralCookieMaxAge?: number;
};

/** The raw `config/brand/values` response of either key set (design.md §8.1). */
export type AffiliateBrandValues = Partial<Record<BrandConfigKeys, unknown>>;

// -----------------------------------------------------------------------------
// RESOLVER
// -----------------------------------------------------------------------------

/**
 * The resolver's own state names (R-NO-SWITCH). No machine backs these —
 * `"inert"` on the server, `"loading"` while the account resolves, `"ready"`
 * once it has settled (with or without a resolved id).
 */
export type AffiliateActiveAccountState = "inert" | "loading" | "ready";

// -----------------------------------------------------------------------------
// SERVICES
// -----------------------------------------------------------------------------

/** The mapped result of the account + balance load (design.md §6.1, §8.1). */
export type ClientAffiliateRecord = {
  data?: IAffiliate;
  balances?: IAffiliateBalance;
};

/**
 * The account and balance reads — query()-keyed on the active account id so
 * two `useClientAffiliate` instances under the same account dedupe onto one
 * request each (design.md §8.1 "two-reads" control, §8.11).
 */
export type AffiliateAccountQuery = UseQueryReturnType<
  IAffiliate | undefined,
  DefaultError
>;
export type AffiliateBalanceQuery = UseQueryReturnType<
  IAffiliateBalance | undefined,
  DefaultError
>;

// -----------------------------------------------------------------------------
// LISTINGS — criteria columns, sort and query models (design.md §8.3)
// -----------------------------------------------------------------------------

type AffiliateStringFilter = {
  eq?: string | null;
  neq?: string | null;
  like?: string | null;
};

type AffiliateNumberFilter = {
  eq?: number | null;
  neq?: number | null;
  gt?: number | null;
  gte?: number | null;
  lt?: number | null;
  lte?: number | null;
};

type AffiliateDateFilter = {
  eq?: string | null;
  gt?: string | null;
  gte?: string | null;
  lt?: string | null;
  lte?: string | null;
  before?: string | null;
  after?: string | null;
};

/** One sort entry over a listing's own sortable field set. */
export type AffiliateSortEntry<TField extends string> = {
  field: TField;
  dir: SortDirection;
};

export type AffiliateLinksSortableField =
  | "created_at"
  | "visit_count"
  | "referral_count";

export type AffiliateReferralsSortableField = "created_at";

export type AffiliateCommissionsSortableField = "amount" | "created_at";

/**
 * The six commission statuses (design.md §5.2, audit DI-3, research L34).
 * Two derivations share this set, each with its own legacy order — the tag
 * order and the summary order. The cancelled branch never fires in either
 * order, because `isPendingApproval` comes first (kept and recorded, DI-3).
 */
export type CommissionStatus =
  | "rejected"
  | "on_hold"
  | "awaiting_payment"
  | "pending_approval"
  | "cancelled"
  | "approved";

export type AffiliatePayoutsSortableField = "amount" | "created_at";

/** Links' whole request state (design.md §8.3). `filters.query` writes `filters.name.like`. */
export type AffiliateLinksQueryModel = {
  filters?: {
    name?: AffiliateStringFilter;
    redirect_url?: AffiliateStringFilter;
    visit_count?: AffiliateNumberFilter;
    referral_count?: AffiliateNumberFilter;
    created_at?: AffiliateDateFilter;
  };
  sort?: AffiliateSortEntry<AffiliateLinksSortableField>[];
  pagination?: { limit?: number; offset?: number };
};

/**
 * Referrals' whole request state. The `affiliate_link.*` columns are DOTTED
 * SCHEMA KEYS, not nested paths — they stay literal on the wire (design.md
 * §8.3, §8.9 "Unmatched query strings").
 */
export type AffiliateReferralsQueryModel = {
  filters?: {
    created_at?: AffiliateDateFilter;
    "affiliate_link.name"?: AffiliateStringFilter;
    "affiliate_link.redirect_url"?: AffiliateStringFilter;
    "affiliate_link.visit_count"?: AffiliateNumberFilter;
    "affiliate_link.referral_count"?: AffiliateNumberFilter;
    "affiliate_link.created_at"?: AffiliateDateFilter;
  };
  sort?: AffiliateSortEntry<AffiliateReferralsSortableField>[];
  pagination?: { limit?: number; offset?: number };
};

export type AffiliateCommissionsQueryModel = {
  filters?: { created_at?: AffiliateDateFilter };
  sort?: AffiliateSortEntry<AffiliateCommissionsSortableField>[];
  pagination?: { limit?: number; offset?: number };
};

export type AffiliatePayoutsQueryModel = {
  filters?: { created_at?: AffiliateDateFilter };
  sort?: AffiliateSortEntry<AffiliatePayoutsSortableField>[];
  pagination?: { limit?: number; offset?: number };
};

/** `[{ field: "created_at", dir: "desc" }]` (design.md §5.2). */
export const AFFILIATE_DEFAULT_SORT: AffiliateSortEntry<"created_at">[] = [
  { field: "created_at", dir: "desc" as SortDirection }
];

/** A collection's `placeholderData` — see `affiliate.utils.ts`'s `accountBoundPlaceholderData`. */
export type AccountBoundPlaceholderData<T> = (
  previousData: T | undefined,
  previousQuery: unknown
) => T | undefined;

/** The four collections' reactive list queries — raw wire rows, no mapper (design.md §5.1). */
export type AffiliateLinksListQuery = ListQuery<
  IAffiliateLink[],
  IAffiliateLink[],
  AffiliateLinksQueryModel
>;
export type AffiliateReferralsListQuery = ListQuery<
  IAffiliateReferral[],
  IAffiliateReferral[],
  AffiliateReferralsQueryModel
>;
export type AffiliateCommissionsListQuery = ListQuery<
  IAffiliatePendingCommission[],
  IAffiliatePendingCommission[],
  AffiliateCommissionsQueryModel
>;
export type AffiliatePayoutsListQuery = ListQuery<
  IAffiliatePayout[],
  AffiliatePayoutRow[],
  AffiliatePayoutsQueryModel
>;

// -----------------------------------------------------------------------------
// PAYOUTS — mapped row (design.md §5.2, D-34, audit D20)
// -----------------------------------------------------------------------------

/**
 * The mapped payout row, camelCase. `mapAffiliatePayout` (`affiliate.mappers.ts`)
 * builds this from the wire `IAffiliatePayout` (`packages/types`, T38).
 *
 * @decision named `AffiliatePayoutRow`, not `AffiliatePayout` — design.md
 * §5.2's stated name.
 * what: renamed, following the precedent this file's own header decision
 *      already set for `AffiliateWithdrawalFormModel`.
 * why: `apps/portal-nuxt/app/portal/mock/contracts/client-affiliate.ts`
 *      already exports `AffiliatePayout` (the mock's own row shape); the
 *      duplicate-type gate denies a second declaration.
 * rejected: importing the mock's type — apps depend on packages, never the
 *      reverse (R-SCOPE-MODULE).
 */
export type AffiliatePayoutRow = {
  id: string;
  createdAt: string;
  amount: number;
  amountFormatted: string;
  success: boolean;
  paymentLog: IAffiliatePayout["payment_log"];
  destinationName: string;
};

// -----------------------------------------------------------------------------
// LINK MANAGER (design.md §8.6)
// -----------------------------------------------------------------------------

/**
 * @decision named `AffiliateLinkFormModel`, not `AffiliateLinkModel` — design.md
 * §5.2's stated name.
 * what: renamed, following the precedent this file's own header decision
 *      already set for `AffiliateWithdrawalFormModel`.
 * why: `apps/portal-nuxt/app/portal/mock/contracts/client-affiliate.ts`
 *      already exports `AffiliateLinkModel`; the duplicate-type gate denies
 *      a second declaration.
 * rejected: importing the mock's type — apps depend on packages, never the
 *      reverse (R-SCOPE-MODULE).
 */
export type AffiliateLinkFormModel = {
  name: string;
  redirectUrl: string;
};

/**
 * The link manager's machine context. `accountId` is the pinned account
 * (design.md §8.4, Editors) — a member `DataManagerContext` does not carry;
 * `brandName` and `defaultRedirectUrl` seed the create door (D-25).
 */
export type AffiliateLinkManagerContext = DataManagerContext<
  AffiliateLinkFormModel,
  Partial<AffiliateLinkFormModel>
> & {
  accountId?: string;
  brandName?: string;
  defaultRedirectUrl?: string;
};

// -----------------------------------------------------------------------------
// PAYOUT DESTINATION MANAGER (design.md §8.6)
// -----------------------------------------------------------------------------

/**
 * @decision named `AffiliatePayoutDestinationFormModel`, not
 * `AffiliatePayoutDestinationModel` — design.md §5.2's stated name.
 * what: renamed, same pattern as `AffiliateLinkFormModel` above.
 * why: `apps/portal-nuxt/app/portal/mock/contracts/client-affiliate.ts`
 *      already exports `AffiliatePayoutDestinationModel`; the duplicate-type
 *      gate denies a second declaration.
 * rejected: importing the mock's type — apps depend on packages, never the
 *      reverse (R-SCOPE-MODULE).
 */
export type AffiliatePayoutDestinationFormModel = {
  payoutDestinationId?: string | null;
  paypalEmailId?: string | null;
};

/** The payout destination manager's machine context (design.md §8.6). */
export type AffiliatePayoutDestinationManagerContext = DataManagerContext<
  AffiliatePayoutDestinationFormModel,
  AffiliatePayoutDestinationFormModel
> & {
  accountId?: string;
  destinations?: IAffiliateBrandPayoutDestination[];
  emails?: IEmail[];
};
