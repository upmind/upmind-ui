import dayjs from "dayjs";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  InvoiceStatus,
  InvoiceStatusGroups,
  TrialEndActionTypes
} from "@upmind-automation/types";
import {
  ContractProductsContextTypes,
  ContractProductState
} from "./contract-product.types";
import type { ContractProduct, UnpaidInvoice } from "./contract-product.types";
import type { ScopeContext } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.utils
 * @description Pure predicates, the three node selectors the machine's entry
 * order reads, the delegated force-set, the forced hide-one-time seam and the
 * future-cancellation anniversary maths. No HTTP, no state reads.
 */

// -----------------------------------------------------------------------------
// Node selectors — flow.md §3 "Entry order"

/**
 * Selects the `unavailable` / `status` node for a product, in the locked order:
 * `unavailable` first, then `cancelling`, then `expiring`, then the code.
 * @returns `undefined` for a `status.code` outside the seven published codes —
 * the machine's last `always` arm reports that as an error (AC12).
 */
export function selectStatusNode(
  product: Pick<
    ContractProduct,
    | "status"
    | "stagedImport"
    | "contractRequest"
    | "renew"
    | "isSubscription"
    | "calculatedCancelDate"
  >
): ContractProductState | undefined {
  const code = product.status?.code;

  if (product.stagedImport) return ContractProductState.STAGED;
  if (code === ContractStatusCodes.CANCELLED)
    return ContractProductState.CANCELLED;
  if (code === ContractStatusCodes.CLOSED) return ContractProductState.LAPSED;
  if (code === ContractStatusCodes.FRAUD) return ContractProductState.FRAUD;

  if (
    product.contractRequest?.status?.code ===
    CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
  ) {
    return ContractProductState.CANCELLING;
  }

  if (
    product.isSubscription &&
    !product.renew &&
    !!product.calculatedCancelDate
  ) {
    return ContractProductState.EXPIRING;
  }

  switch (code) {
    case ContractStatusCodes.PENDING:
      return ContractProductState.PENDING;
    case ContractStatusCodes.AWAITING_ACTIVATION:
      return ContractProductState.INACTIVE;
    case ContractStatusCodes.ACTIVE:
      return ContractProductState.ACTIVE;
    case ContractStatusCodes.SUSPENDED:
      return ContractProductState.SUSPENDED;
    default:
      return undefined;
  }
}

/** `setup.incomplete` / `setup.complete` — the nullish default is load-bearing (R15, ADR-24). */
export function selectSetupNode(
  product: Pick<ContractProduct, "provisionSetupFieldsConfirmed">
): ContractProductState {
  return !(product.provisionSetupFieldsConfirmed ?? true)
    ? ContractProductState.SETUP_INCOMPLETE
    : ContractProductState.SETUP_COMPLETE;
}

/** `trial.running` / `trial.ending` / `trial.none`. */
export function selectTrialNode(
  product: Pick<ContractProduct, "inTrial" | "trialEndAction">
): ContractProductState {
  if (!product.inTrial) return ContractProductState.TRIAL_NONE;
  return product.trialEndAction === TrialEndActionTypes.CANCEL
    ? ContractProductState.TRIAL_ENDING
    : ContractProductState.TRIAL_RUNNING;
}

// -----------------------------------------------------------------------------
// Criteria seams — design 8.5, 8.6

/**
 * The client's `exclude_delegated` force-set (ADR-8, design 8.5). The
 * `DELEGATED` selector context always forces `0`; otherwise the held
 * preference wins, and with none held `1` unless the session has no delegated
 * products to exclude at all.
 */
export function resolveExcludeDelegated(
  scopeContext: ScopeContext | undefined,
  preference: boolean | undefined,
  hasDelegatedProducts: boolean
): 0 | 1 {
  if (scopeContext?.type === ContractProductsContextTypes.DELEGATED) return 0;
  if (preference === true) return 1;
  if (preference === false) return 0;
  return hasDelegatedProducts ? 1 : 0;
}

/**
 * The forced hide-one-time-purchases seam (design 8.6, ADR-14). Reads the
 * brand's `@context.oneTimePurchases` visibility once FE-3244 exposes the
 * `portal` scope; until then the rule is not forced.
 */
export function hidesOneTimePurchasesForced(): boolean {
  return false;
}

// -----------------------------------------------------------------------------
// Future-cancellation anniversary maths (research F18, rows P25-P26)

const BACKEND_DATE_FORMAT = "YYYY-MM-DD";

type AnniversaryAnchor = { reference: dayjs.Dayjs; billingCycleMonths: number };

/**
 * The anchor for every future-cancellation calculation: `next_due_date` plus
 * the billing cycle length. `null` when either input is missing.
 */
export function anniversaryAnchor(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">
): AnniversaryAnchor | null {
  const { nextDueDate, billingCycleMonths } = product;
  if (!nextDueDate || !billingCycleMonths || billingCycleMonths < 0)
    return null;

  return { reference: dayjs(nextDueDate).startOf("day"), billingCycleMonths };
}

/** The anniversary date at a given cycle count off the product's own anchor. */
export function anniversaryAtCycle(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">,
  cycles: number
): dayjs.Dayjs | null {
  const anchor = anniversaryAnchor(product);
  if (!anchor) return null;

  return anchor.reference.add(cycles * anchor.billingCycleMonths, "month");
}

/** The earliest cycle a client may schedule for: the next anniversary strictly after today. */
export function minFutureCancellationCycle(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">
): number | null {
  if (!anniversaryAnchor(product)) return null;

  const today = dayjs().startOf("day");
  let cycles = 0;
  while (!anniversaryAtCycle(product, cycles)?.isAfter(today)) {
    cycles += 1;
  }
  return cycles;
}

/** The earliest selectable future-cancellation date, as a wire date string. */
export function minFutureCancellationDate(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">
): string | null {
  const cycles = minFutureCancellationCycle(product);
  if (cycles === null) return product.nextDueDate ?? null;

  return (
    anniversaryAtCycle(product, cycles)?.format(BACKEND_DATE_FORMAT) ?? null
  );
}

// -----------------------------------------------------------------------------
// Unpaid-invoice predicates (AC10, ADR-10, design 8.7 [o23])
//
// Pure functions of `Pick<IInvoice, "status">` — never meta (R23 restricts
// meta to `is*`/`has*`/`can*` booleans; these take an argument). Consumers
// call them per invoice, e.g. over `hasUnpaidRecurringInvoices`'s list.

const DUE_STATUSES: readonly InvoiceStatus[] = InvoiceStatusGroups.UNPAID;

/**
 * `[UNPAID, OVERDUE]` — the legacy `isCancellable` set (`store/modules/data/
 * invoices/index.ts:123-127` [o23]). Narrower than `InvoiceStatusGroups.UNPAID`
 * (which also carries `ADJUSTED`) and has no published-group counterpart to
 * reuse.
 */
const CANCELLABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.UNPAID,
  InvoiceStatus.OVERDUE
];

/** True while the invoice still carries an outstanding balance. */
export function isDue(invoice: UnpaidInvoice): boolean {
  return DUE_STATUSES.includes(invoice.status?.code as InvoiceStatus);
}

/** True while cancelling the invoice still means anything. */
export function isCancellable(invoice: UnpaidInvoice): boolean {
  return CANCELLABLE_STATUSES.includes(invoice.status?.code as InvoiceStatus);
}
