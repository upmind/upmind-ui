// -----------------------------------------------------------------------------
/**
 * @module affiliate
 * @description The client self-service affiliate data layer and the guest
 * referral-link visit (design.md §5.1). This barrel is the module's ONLY
 * public surface — `affiliate.services.ts`, `affiliate.mappers.ts`,
 * `affiliate.schemas.ts` and each `*.machine.ts` carry a line-1 internal
 * marker and are never imported directly by another module.
 */

// --- Composables
export {
  useAffiliateActiveAccount,
  type UseAffiliateActiveAccount
} from "./useAffiliateActiveAccount";
export {
  useClientAffiliate,
  type UseClientAffiliate
} from "./useClientAffiliate";
export { useAffiliateLinks } from "./useAffiliateLinks";
export {
  useAffiliateLinkManager,
  type UseAffiliateLinkManager
} from "./useAffiliateLinkManager";
export { useAffiliateReferrals } from "./useAffiliateReferrals";
export { useAffiliateCommissions } from "./useAffiliateCommissions";
export { useAffiliatePayouts } from "./useAffiliatePayouts";
export {
  useAffiliatePayoutDestinationManager,
  type UseAffiliatePayoutDestinationManager
} from "./useAffiliatePayoutDestinationManager";
export {
  useAffiliateLinkVisit,
  type UseAffiliateLinkVisit
} from "./useAffiliateLinkVisit";

// --- Scope matrices, public
export {
  CLIENT_AFFILIATE_SCOPE_MATRIX,
  AFFILIATE_LINK_VISIT_SCOPE_MATRIX
} from "./affiliate.types";
export type {
  AffiliateScopeMatrix,
  AffiliateLinkVisitScopeMatrix
} from "./affiliate.types";

// --- Public model types
export type {
  AffiliateLinkVisitModel,
  AffiliateWithdrawalFormModel,
  AffiliateLinkFormModel,
  AffiliatePayoutDestinationFormModel,
  AffiliatePayoutRow,
  AffiliateLinksQueryModel,
  AffiliateReferralsQueryModel,
  AffiliateCommissionsQueryModel,
  AffiliatePayoutsQueryModel,
  AffiliateLinksSortableField,
  AffiliateReferralsSortableField,
  AffiliateCommissionsSortableField,
  AffiliatePayoutsSortableField,
  AffiliateSortEntry,
  CommissionStatus
} from "./affiliate.types";
export { AFFILIATE_DEFAULT_SORT } from "./affiliate.types";

// --- Utilities
export { referralOrigin } from "./affiliate.utils";
export {
  commissionTagStatus,
  commissionSummaryStatus
} from "./affiliate.utils";
export {
  isPaypalDestination,
  defaultPayoutDestination
} from "./affiliate.utils";

// --- Sub-composable type exports for consumers (resolver)
export type { UseAffiliateActiveAccountActions } from "./useAffiliateActiveAccount.actions";
export type { UseAffiliateActiveAccountContext } from "./useAffiliateActiveAccount.context";
export type { UseAffiliateActiveAccountMeta } from "./useAffiliateActiveAccount.meta";
export type { UseAffiliateActiveAccountInternals } from "./useAffiliateActiveAccount.internals";

// --- Sub-composable type exports for consumers (link visit)
export type { UseAffiliateLinkVisitActions } from "./useAffiliateLinkVisit.actions";
export type { UseAffiliateLinkVisitContext } from "./useAffiliateLinkVisit.context";
export type { UseAffiliateLinkVisitMeta } from "./useAffiliateLinkVisit.meta";
export type { UseAffiliateLinkVisitInternals } from "./useAffiliateLinkVisit.internals";

// --- Sub-composable type exports for consumers (link manager)
export type { UseAffiliateLinkManagerActions } from "./useAffiliateLinkManager.actions";
export type { UseAffiliateLinkManagerContext } from "./useAffiliateLinkManager.context";
export type { UseAffiliateLinkManagerMeta } from "./useAffiliateLinkManager.meta";
export type { UseAffiliateLinkManagerInternals } from "./useAffiliateLinkManager.internals";

// --- Sub-composable type exports for consumers (payout destination manager)
export type { UseAffiliatePayoutDestinationManagerActions } from "./useAffiliatePayoutDestinationManager.actions";
export type { UseAffiliatePayoutDestinationManagerContext } from "./useAffiliatePayoutDestinationManager.context";
export type { UseAffiliatePayoutDestinationManagerMeta } from "./useAffiliatePayoutDestinationManager.meta";
export type { UseAffiliatePayoutDestinationManagerInternals } from "./useAffiliatePayoutDestinationManager.internals";

// `useClientAffiliate`, `useAffiliateLinks`, `useAffiliateReferrals`,
// `useAffiliateCommissions` and `useAffiliatePayouts` export no sub-composable
// type aliases — the portal mock this module replaces already exports the
// identically-named `UseClientAffiliate*` / `UseAffiliateLinks*` /
// `UseAffiliateReferrals*` / `UseAffiliateCommissions*` / `UseAffiliatePayouts*`
// contract types (design.md §1.3; see each layer file's own header decision).
