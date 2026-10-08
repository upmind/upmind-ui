/** @internal */
import dayjs from "dayjs";
import { assign, sendParent, spawn } from "xstate";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  InvoiceConsolidationTypes,
  ProductTypes
} from "@upmind-automation/types";
import { productMachine } from "../product";
import { BACKEND_DATE_FORMAT } from "../stats";
import { useI18n } from "../system-localisation";
import {
  ContractProductCancelOption,
  ContractProductRegionWriteStates,
  ContractProductsContextTypes
} from "./contract-product.types";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches,
  useValidation
} from "../../utils";
import {
  cloneDeep,
  compact,
  includes,
  isEmpty,
  uniqueId,
  values
} from "lodash-es";
import type {
  AnniversaryAnchor,
  ContractProduct,
  ContractProductContext,
  ContractProductForm,
  ContractProductIds,
  MigrationGateFacts,
  MigrationTarget
} from "./contract-product.types";
import type { ProductConfigContext } from "../product";
import type { ScopeContext } from "../scope/scope.types";
import type { ActorRef, AnyEventObject, AnyState } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.utils
 * @description The eligibility rule of each write, read by both the meta gates
 * and the machine guards; the delegated force-set; the future-cancellation
 * anniversary maths; and the migration seed and spawn. No HTTP, no state reads.
 */

/** The 404 a contract-product request rejects with when a required id is missing. */
export function notAvailableError(ids: ContractProductIds): DetailedError {
  const { t } = useI18n();

  return new DetailedError(
    t("error.contract_product_not_available"),
    responseCodes.Not_Found,
    ErrorOrigin.Headless,
    { contractId: ids.contractId, contractProductId: ids.contractProductId }
  );
}

// -----------------------------------------------------------------------------
// Cancellation

/** True when the product carries a pending HARD cancellation request. */
export function hasHardCancellationRequest(
  product: Pick<ContractProduct, "contractRequest">
): boolean {
  return (
    product.contractRequest?.status?.code ===
    CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
  );
}

/**
 * True when the subscription is set to auto-expire: a live subscription (not
 * cancelled, not lapsed) that has stopped renewing and carries a calculated
 * cancel date.
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
 * True when the client may request immediate cancellation (HARD), which is
 * also when the cancellation form is offered at all: a subscription the
 * platform lets the client cancel, not auto-expiring, with no hard request
 * pending, no future cancellation scheduled and no pro-rata invoice unpaid.
 */
export function canRequestCancellation(
  product: Pick<
    ContractProduct,
    | "contractRequest"
    | "isSubscription"
    | "renew"
    | "status"
    | "calculatedCancelDate"
    | "canCancel"
    | "hasScheduledFutureCancellation"
    | "proRataPending"
  >
): boolean {
  return (
    product.isSubscription &&
    !hasAutoExpireEnabled(product) &&
    !hasHardCancellationRequest(product) &&
    !product.hasScheduledFutureCancellation &&
    !product.proRataPending &&
    !!product.canCancel
  );
}

/** True when the client may cancel at the end of the term (SOFT): a cancellable product whose contract is not pending. */
export function canRequestEndOfTerm(
  product: Parameters<typeof canRequestCancellation>[0] &
    Pick<ContractProduct, "contractStatus">
): boolean {
  return (
    canRequestCancellation(product) &&
    product.contractStatus !== ContractStatusCodes.PENDING
  );
}

/** True when the client may book a cancellation for a future anniversary: an end-of-term cancellation is allowed and an anniversary exists. */
export function canScheduleFutureCancellation(
  product: Parameters<typeof canRequestEndOfTerm>[0] &
    Pick<ContractProduct, "nextDueDate" | "billingCycleMonths">
): boolean {
  return canRequestEndOfTerm(product) && !!anniversaryAnchor(product);
}

/** The cancellation options this product allows, each by its own rule. */
export function cancellationOptions(
  product: Parameters<typeof canScheduleFutureCancellation>[0]
): ContractProductCancelOption[] {
  return compact([
    canRequestEndOfTerm(product) && ContractProductCancelOption.SOFT,
    canRequestCancellation(product) && ContractProductCancelOption.HARD,
    canScheduleFutureCancellation(product) &&
      ContractProductCancelOption.SCHEDULE_FUTURE
  ]);
}

/**
 * True when the client may open the consolidation form: a live subscription
 * that is not staged, whose client setting enables (or inherits)
 * consolidation, and whose product allows it.
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

/** True while a form-region write is in flight; no formless write or form submit is accepted then. */
export function hasRegionWrite(state: AnyState): boolean {
  return stateMatches(state, values(ContractProductRegionWriteStates));
}

// -----------------------------------------------------------------------------
// Criteria

/**
 * The client's `exclude_delegated` force-set. The `DELEGATED` selector context
 * always forces `0`. A session with no delegated products always sends `1`.
 * Otherwise the held preference wins, and with none held `0`.
 */
export function resolveExcludeDelegated(
  scopeContext: ScopeContext | undefined,
  preference: boolean | undefined,
  hasDelegatedProducts: boolean
): 0 | 1 {
  if (scopeContext?.type === ContractProductsContextTypes.DELEGATED) return 0;
  if (!hasDelegatedProducts) return 1;
  return preference ? 1 : 0;
}

// -----------------------------------------------------------------------------
// Future-cancellation anniversary maths

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

// -----------------------------------------------------------------------------
// Lifecycle writes — each rule reads the record, never a machine node

/**
 * True when renewal invoicing may be turned off: a subscription whose renewal
 * invoicing is on, outside the PENDING, CANCELLED and CLOSED statuses, that the platform allows to stop (`?? true` when the
 * product carries no answer), outside a trial and outside auto-expire. The
 * unpaid invoices of the product do not hold it back: the platform allows the
 * switch-off with them.
 */
export function canDisableAutoRenew(
  product: Pick<
    ContractProduct,
    | "isSubscription"
    | "autoCreateRenewInvoice"
    | "product"
    | "meta"
    | "inTrial"
    | "status"
    | "renew"
    | "calculatedCancelDate"
  >
): boolean {
  return (
    product.isSubscription &&
    product.autoCreateRenewInvoice &&
    (product.product?.can_disable_auto_create_renew_invoice ?? true) &&
    !product.meta.isPending &&
    !product.meta.isCancelled &&
    !product.meta.isClosed &&
    !product.inTrial &&
    !hasAutoExpireEnabled(product)
  );
}

/** True when renewal invoicing may be turned on: a subscription whose renewal invoicing is off, outside the PENDING, CANCELLED and CLOSED statuses and outside auto-expire. */
export function canEnableAutoRenew(
  product: Pick<
    ContractProduct,
    | "isSubscription"
    | "autoCreateRenewInvoice"
    | "meta"
    | "status"
    | "renew"
    | "calculatedCancelDate"
  >
): boolean {
  return (
    product.isSubscription &&
    !product.autoCreateRenewInvoice &&
    !product.meta.isPending &&
    !product.meta.isCancelled &&
    !product.meta.isClosed &&
    !hasAutoExpireEnabled(product)
  );
}

/** True when the next invoice may be raised: a subscription that is not staged and that the platform lets raise it. */
export function canIssueNextInvoice(
  product: Pick<
    ContractProduct,
    "isSubscription" | "stagedImport" | "canCreateNextInvoice"
  >
): boolean {
  return (
    product.isSubscription &&
    !product.stagedImport &&
    product.canCreateNextInvoice
  );
}

/**
 * True when the trial may be ended early: the product is in trial and does not
 * wait for activation. A trial that ends in cancellation counts too, so this
 * reads the record and not the trial nodes.
 */
export function canEndTrial(
  product: Pick<ContractProduct, "inTrial" | "meta">
): boolean {
  return product.inTrial && !product.meta.isAwaitingActivation;
}

/**
 * True when the next invoice date is still ahead, by the UTC end of its day, so
 * a date of today is ahead until UTC midnight. False when there is no date.
 */
export function isNextInvoiceDateInFuture(
  product: Pick<ContractProduct, "nextInvoiceDate">
): boolean {
  return (
    !!product.nextInvoiceDate &&
    dayjs.utc(product.nextInvoiceDate).endOf("day").isAfter(dayjs())
  );
}

// -----------------------------------------------------------------------------
// Migration — the rule, the request input, the seed and the spawn

/**
 * True when the client may start a migration. The raw status code is read,
 * never the status node: the node differs from the code for an expiring or a
 * cancelling product.
 */
export function canMigrateProduct(product: MigrationGateFacts): boolean {
  const code = product.status?.code;
  const acceptedRequest =
    includes(
      [ContractStatusCodes.CANCELLED, ContractStatusCodes.CLOSED],
      code
    ) &&
    product.contractRequest?.status?.code ===
      CancellationRequestStatusCodes.REQUEST_ACCEPTED;

  return (
    product.canModify &&
    !hasHardCancellationRequest(product) &&
    !acceptedRequest &&
    !hasAutoExpireEnabled(product) &&
    product.productType === ProductTypes.SINGLE_PRODUCT &&
    !isEmpty(product.allowedMigrations) &&
    includes(
      [ContractStatusCodes.ACTIVE, ContractStatusCodes.SUSPENDED],
      code
    ) &&
    !product.stagedImport &&
    !product.proRataPending
  );
}

/**
 * Spawns the stock product machine for a chosen product. The child starts on
 * the current term and quantity (never below the product's unit quantity), in
 * the contract currency, with promotions omitted and no coupons; it sets no
 * basket and no client.
 *
 * Its action overrides: `setBasketHelper` connects nothing to the basket;
 * `calculate` and `update` hand the model to the manager, which sends the dry
 * run and the commit; `refreshContext` keeps the contract currency. The model
 * handed over is a copy, because the option editors change the child's nested
 * options in place and the manager compares the next model with this one.
 */
export function spawnMigrationChild(
  context: ContractProductContext,
  target: MigrationTarget
): ActorRef<AnyEventObject> {
  const id = uniqueId("migrationTarget-");

  return spawn(
    productMachine
      .withContext({
        id,
        model: {
          productId: target.id,
          term: context.contractProduct?.billingCycleMonths,
          quantity: Math.max(
            context.contractProduct?.raw.quantity ?? 1,
            context.contractProduct?.raw.product?.unit_quantity ?? 1
          )
        },
        currencyId: context.contractProduct?.contractCurrencyId,
        promotions: false,
        coupons: []
      })
      .withConfig({
        actions: {
          setBasketHelper: assign<ProductConfigContext, AnyEventObject>({}),
          calculate: sendParent<
            ProductConfigContext,
            AnyEventObject,
            AnyEventObject
          >(
            ({ model, rawProduct }): AnyEventObject => ({
              type: "MIGRATION.CHANGED",
              data: { model: cloneDeep(model), rawProduct }
            })
          ),
          update: sendParent<
            ProductConfigContext,
            AnyEventObject,
            AnyEventObject
          >(
            ({ model, rawProduct }): AnyEventObject => ({
              type: "MIGRATION.COMMIT",
              data: { model: cloneDeep(model), rawProduct }
            })
          ),
          refreshContext: assign<ProductConfigContext, AnyEventObject>({})
        }
      }),
    { name: id }
  );
}
