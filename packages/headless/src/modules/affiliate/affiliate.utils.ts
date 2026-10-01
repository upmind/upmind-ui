import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { AffiliatePayoutDestinationCode } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import { mapToHeadlessError, responseCodes } from "../../utils";
import { find } from "lodash-es";
import type {
  AffiliatePayoutDestinationFormModel,
  CommissionStatus
} from "./affiliate.types";
import type {
  IAffiliateBrandPayoutDestination,
  IAffiliatePendingCommission,
  IBrand,
  IDomain,
  IEmail
} from "@upmind-automation/types";

dayjs.extend(utc);
// -----------------------------------------------------------------------------
/**
 * @module affiliate/affiliate.utils
 * @description Pure helpers shared across the module's composables (design.md
 * §8.5, §8.6). No `.{actor}.ts` arm — a pure function has no per-actor
 * construction to hook (`ARMS.md`).
 */

/**
 * The origin of the brand's `default` oauth client, as legacy's `generateLink`
 * (design.md §8.5). `""` when no brand or no `default` entry exists — the
 * module builds no URL and no path (D-31); the consumer joins
 * `{referralOrigin}/aff/{hash}` itself (consumer obligation 7).
 */
export function referralOrigin(brand?: IBrand | null): string {
  const client = find(brand?.oauth_clients, ["default", true]) as
    | IDomain
    | undefined;
  return client?.origin ?? "";
}

/** Every client composable refuses any resolved actor other than CLIENT (design.md D-21). */
export function isClientScopeActor(actorScope: ScopeActorTypes): boolean {
  return actorScope === ScopeActorTypes.CLIENT;
}

/** True for a 404 — the account/balance query functions swallow it as empty data. */
export function isNotFoundError(err: unknown): boolean {
  return mapToHeadlessError(err)?.status === responseCodes.Not_Found;
}

/**
 * Builds a `list()` `placeholderData` function that keeps the previous rows
 * only while the collection's CURRENT `keyAccountId` is defined; a cleared
 * account (design.md §8.4) shows no row of the previous account.
 *
 * @decision reads only `keyAccountId.value`, never `previousQuery.queryKey`.
 * what: drops the prior "compare the previous key's account segment against
 *      `keyAccountId`" check.
 * why: `previousQuery.queryKey` embeds the SAME mutable `Ref` this factory
 *      closes over (it is never a frozen value snapshot) — reading it back
 *      out inside `placeholderData` observes the ref's CURRENT value, not
 *      the value at the time `previousData` was fetched. Once `keyAccountId`
 *      had already cleared to `undefined`, both sides of that comparison
 *      read `undefined` and matched by coincidence, so a cleared account
 *      kept serving the previous account's stale rows (the `keep-key-on-clear`
 *      defect, `__tests__/CONTROLS.md` row 69).
 * rejected: special-casing the `undefined` branch only — a narrower
 *      comparison would still read the same unreliable, ref-aliased
 *      `previousQuery.queryKey`; the defect is the read itself.
 */
export function accountBoundPlaceholderData<TData>(keyAccountId: {
  value: string | undefined;
}): (
  previousData: TData | undefined,
  previousQuery: unknown
) => TData | undefined {
  return previousData =>
    keyAccountId.value !== undefined ? previousData : undefined;
}

// -----------------------------------------------------------------------------
// Commission status derivations (design.md §5.2, audit DI-3, research L34)
// vue:store/modules/data/affiliates/commissions.ts:26-47

function isRejected(c: IAffiliatePendingCommission): boolean {
  return !!c.rejected;
}
function isOnHold(c: IAffiliatePendingCommission): boolean {
  return !!c.suspended;
}
function isAwaitingPayment(c: IAffiliatePendingCommission): boolean {
  return !c.invoice_paid && !c.commission_approved;
}
function isPendingApproval(c: IAffiliatePendingCommission): boolean {
  return !c.commission_approved;
}
function isCancelled(c: IAffiliatePendingCommission): boolean {
  return (
    !c.commission_approved && dayjs.utc(c.keep_until).toDate() < new Date()
  );
}

// -----------------------------------------------------------------------------
// Payout destination manager helpers (design.md §8.6, audit DI-5)

/**
 * True when `destinationId` is the PayPal destination. A `null`/`undefined`
 * id inherits the default destination's code (audit DI-5).
 */
export function isPaypalDestination(
  destinationId: string | null | undefined,
  destinations: IAffiliateBrandPayoutDestination[] = []
): boolean {
  const target = destinationId
    ? find(destinations, ["id", destinationId])
    : find(destinations, "default");
  return target?.code === AffiliatePayoutDestinationCode.PAYPAL;
}

/** The destinations page's own default entry, if any. */
export function defaultPayoutDestination(
  destinations: IAffiliateBrandPayoutDestination[] = []
): IAffiliateBrandPayoutDestination | undefined {
  return find(destinations, "default");
}

/** The client's default email — the emails page's `-default,-id` sort puts it first. */
function defaultPayoutEmail(emails: IEmail[] = []): IEmail | undefined {
  return find(emails, "default") ?? emails[0];
}

/**
 * Writes `paypalEmailId` to the default email only when the destination is
 * PayPal, the email is empty, and a default exists (design.md §8.6).
 */
export function preselectPaypalEmail(
  model: AffiliatePayoutDestinationFormModel,
  destinations: IAffiliateBrandPayoutDestination[] = [],
  emails: IEmail[] = []
): AffiliatePayoutDestinationFormModel {
  if (
    model.paypalEmailId ||
    !isPaypalDestination(model.payoutDestinationId, destinations)
  ) {
    return model;
  }
  const defaultEmail = defaultPayoutEmail(emails);
  return defaultEmail ? { ...model, paypalEmailId: defaultEmail.id } : model;
}

/** The tag order (`commissionAmountTag.vue:47-59`, audit DI-3). */
export function commissionTagStatus(
  commission: IAffiliatePendingCommission
): CommissionStatus {
  if (isRejected(commission)) return "rejected";
  if (isOnHold(commission)) return "on_hold";
  if (isAwaitingPayment(commission)) return "awaiting_payment";
  if (isPendingApproval(commission)) return "pending_approval";
  if (isCancelled(commission)) return "cancelled";
  return "approved";
}

/** The summary order (`commissionSummary.vue:64-163`, audit DI-3). */
export function commissionSummaryStatus(
  commission: IAffiliatePendingCommission
): CommissionStatus {
  if (isRejected(commission)) return "rejected";
  if (isAwaitingPayment(commission)) return "awaiting_payment";
  if (isPendingApproval(commission)) return "pending_approval";
  if (isOnHold(commission)) return "on_hold";
  if (isCancelled(commission)) return "cancelled";
  return "approved";
}
