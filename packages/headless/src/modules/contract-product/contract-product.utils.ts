import dayjs from "dayjs";
import { watch } from "vue";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  InvoiceConsolidationTypes,
  InvoiceStatus,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import { useI18n } from "../system-localisation";
import {
  ContractProductCancelOption,
  ContractProductsContextTypes
} from "./contract-product.types";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useValidation
} from "../../utils";
import { isEmpty } from "lodash-es";
import type {
  ContractProduct,
  ContractProductForm,
  UnpaidInvoice
} from "./contract-product.types";
import type { ScopeContext } from "../scope/scope.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.utils
 * @description Pure predicates, the three node selectors the machine's entry
 * order reads, the delegated force-set, the forced hide-one-time seam and the
 * future-cancellation anniversary maths. No HTTP, no state reads.
 */

// -----------------------------------------------------------------------------
// Node selectors — flow.md §3 "Entry order"

// -----------------------------------------------------------------------------
// Cancellation options — the ONE combined form (R33; legacy `clientCancelOptions`)

/**
 * True when the product carries a pending HARD cancellation request
 * (`contract_request.status.code === request_cancellation_request`) — legacy
 * `hasHardCancellationRequest` (`contractCancellation.ts:351-356`).
 */
export function hasHardCancellationRequest(
  product: Pick<ContractProduct, "contractRequest">
): boolean {
  return (
    product.contractRequest?.status?.code ===
    CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
  );
}

/**
 * True when the subscription is set to auto-expire: it is a live subscription
 * (not cancelled, not lapsed) that has stopped renewing and carries a
 * calculated cancel date — legacy `hasAutoExpireEnabled`
 * (`store/modules/data/contracts/products.ts:175-182`).
 */
export function hasAutoExpireEnabled(
  product: Pick<
    ContractProduct,
    "isSubscription" | "status" | "renew" | "calculatedCancelDate"
  >
): boolean {
  if (!product.isSubscription) return false;
  const code = product.status?.code;
  if (code === ContractStatusCodes.CANCELLED) return false;
  if (code === ContractStatusCodes.CLOSED) return false;
  return !product.renew && !!product.calculatedCancelDate;
}

/**
 * The cancellation options this product allows (legacy `clientCancelOptions`,
 * `contractCancellation.ts:300-333`), derived from the record only. The brand
 * setting `SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION` is NOT read (design 8.3
 * — the module reads no brand setting), so HARD turns on the record facts alone.
 *
 * Legacy hides the WHOLE cancel entry (`cProdProvider.vue:252-275`) once the
 * subscription auto-expires, a hard request is pending, or a future
 * cancellation is scheduled — modelled here as the three early `[]` returns.
 */
export function cancellationOptions(
  product: Pick<
    ContractProduct,
    | "contractRequest"
    | "contractStatus"
    | "isSubscription"
    | "renew"
    | "status"
    | "calculatedCancelDate"
    | "canCancel"
    | "hasScheduledFutureCancellation"
    | "nextDueDate"
    | "billingCycleMonths"
    | "proRataPending"
  >
): ContractProductCancelOption[] {
  const options: ContractProductCancelOption[] = [];
  if (!product.isSubscription) return options;
  if (hasAutoExpireEnabled(product)) return options;
  if (hasHardCancellationRequest(product)) return options;
  if (product.hasScheduledFutureCancellation) return options;
  // Legacy cProdProvider.vue cancelOption: a pending pro-rata invoice, or a
  // client the platform does not allow to cancel, disables cancelling.
  if (product.proRataPending) return options;
  if (!product.canCancel) return options;

  const isPending = product.contractStatus === ContractStatusCodes.PENDING;

  // SOFT — cancel at end of term; not while the contract is pending.
  if (!isPending) options.push(ContractProductCancelOption.SOFT);
  // HARD — request immediate cancellation (ADR-25, ADR-27).
  options.push(ContractProductCancelOption.HARD);
  // SCHEDULE_FUTURE — needs a live subscription and an anniversary anchor.
  if (!isPending && !!anniversaryAnchor(product)) {
    options.push(ContractProductCancelOption.SCHEDULE_FUTURE);
  }

  return options;
}

/**
 * True when the client may open the consolidation form on this product — legacy
 * `cProdInvoiceConsolidationComp.vue:74-97` `isVisible`/`canConsolidate`, the
 * record-level parts only. A live subscription that is not staged, whose client
 * setting enables (or inherits) consolidation, and whose product allows it.
 *
 * @decision
 *   what: brand `INVOICE_CONSOLIDATION_ENABLED` and the actor
 *     `INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF` config are NOT read, and the
 *     `update_contract_product` permission is not on the product read — so
 *     `ENABLED` and `INHERIT` both collapse to the product fact alone.
 *   why: design 8.3 — the module reads no brand setting, and no permission
 *     channel reaches this pure selector.
 *   rejected: adding a brand-config or permission request — outside the
 *     module's read surface (reported instead).
 */
export function canConsolidate(
  product: Pick<
    ContractProduct,
    | "isSubscription"
    | "stagedImport"
    | "clientInvoiceConsolidationEnabled"
    | "product"
  >
): boolean {
  if (!product.isSubscription) return false;
  if (product.stagedImport) return false;

  const clientType = product.clientInvoiceConsolidationEnabled;
  if (
    clientType !== InvoiceConsolidationTypes.ENABLED &&
    clientType !== InvoiceConsolidationTypes.INHERIT
  ) {
    return false;
  }
  return !!product.product?.invoice_consolidation_enabled;
}

// -----------------------------------------------------------------------------
// Criteria seams — design 8.5, 8.6

/**
 * The client's `exclude_delegated` force-set (ADR-8, design 8.5), as legacy
 * sends it. The `DELEGATED` selector context always forces `0`. A session
 * with no delegated products always sends `1`, whatever was chosen before
 * (legacy `products.ts` `list`). Otherwise the held preference wins, and with
 * none held `0` (legacy `views/client/products/index.vue` `initForm`).
 */
export function resolveExcludeDelegated(
  scopeContext: ScopeContext | undefined,
  preference: boolean | undefined,
  hasDelegatedProducts: boolean
): 0 | 1 {
  if (scopeContext?.type === ContractProductsContextTypes.DELEGATED) return 0;
  if (!hasDelegatedProducts) return 1;
  return preference === true ? 1 : 0;
}

/** Resolves once the stored show-delegated preference has settled — held, or known absent. */
export function whenPreferenceSettles(
  isSettled: ComputedRef<boolean>
): Promise<void> {
  if (isSettled.value) return Promise.resolve();

  return new Promise<void>(resolve => {
    const stop = watch(isSettled, settled => {
      if (!settled) return;
      stop();
      resolve();
    });
  });
}

/**
 * The forced hide-one-time-purchases seam (design 8.6, ADR-14): the brand's
 * `@context.oneTimePurchases` portal visibility, as legacy `brand/index.ts`
 * `hideOneTimePurchases` reads it and `cProdsProvider.vue` applies it.
 */
export function hidesOneTimePurchasesForced(
  portal: Record<string, string> | undefined
): boolean {
  return portal?.["@context.oneTimePurchases"] === "hidden";
}

// -----------------------------------------------------------------------------
// Future-cancellation anniversary maths (research.md F18 — no parity row)

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

/** Which cycle `date` lands on off the product's anchor, or `null` when it isn't an exact multiple of the billing cycle. */
export function anniversaryCycleForDate(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">,
  date: Date | string
): number | null {
  const anchor = anniversaryAnchor(product);
  if (!anchor) return null;

  const candidate = dayjs(date).startOf("day");
  const monthsDiff = candidate.diff(anchor.reference, "month");
  if (monthsDiff % anchor.billingCycleMonths !== 0) return null;

  const cycles = monthsDiff / anchor.billingCycleMonths;
  return anniversaryAtCycle(product, cycles)?.isSame(candidate, "day")
    ? cycles
    : null;
}

/** Whether `date` is a valid future-cancellation anniversary: an exact cycle, on or after `minFutureCancellationDate`. */
export function isSelectableFutureCancellationDate(
  product: Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">,
  date: Date | string
): boolean {
  const cycles = anniversaryCycleForDate(product, date);
  const minCycles = minFutureCancellationCycle(product);
  if (cycles === null || minCycles === null) return false;

  return cycles >= minCycles;
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

// -----------------------------------------------------------------------------
// Write forms

/** Rejects with a 422 carrying the AJV errors when the form's model is invalid. */
export async function validateForm({
  schema,
  model
}: ContractProductForm = {}): Promise<void> {
  if (!schema) return;

  const { validate } = useValidation();
  const errors = validate(schema, model);

  if (!isEmpty(errors)) {
    throw new DetailedError(
      useI18n().t("error.contract_product_validation_failed"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      errors
    );
  }
}
