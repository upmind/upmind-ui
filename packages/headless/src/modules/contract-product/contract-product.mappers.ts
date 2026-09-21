/** @internal */
import { CancellationRequestStatusCodes } from "@upmind-automation/types";
import { castArray, map, pick } from "lodash-es";
import type {
  ConsolidationBody,
  ContractProduct,
  ContractProductRequest,
  ScheduleCancellationBody,
  ScheduleCancellationModel,
  ScheduledAction,
  SetConsolidationModel,
  SoftCancelBody,
  SoftCancelModel,
  UnpaidInvoice
} from "./contract-product.types";
import type {
  ContractStatusCodes,
  IContractCancellationRequest,
  IContractProduct,
  IInvoice,
  IScheduledAction
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.mappers
 * @description Wire ↔ view-model shaping for contract products (design 8.10,
 * R19). Inbound: `mapContractProducts` / `mapContractProduct`. Outbound: one
 * body mapper per write of design 8.3. Pure — no side effects, no HTTP.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContractProducts.ts` / `useContractProduct.ts`, or the barrel's curated
 * `mapContractProduct` export (`@internal/no-cross-module-imports`).
 */

/** Maps the list response to the view-model collection. */
export function mapContractProducts(
  raw: IContractProduct | IContractProduct[]
): ContractProduct[] {
  return map(castArray(raw), mapContractProduct);
}

/** Maps one wire record to the view model, deriving the two shared readings once. */
export function mapContractProduct(raw: IContractProduct): ContractProduct {
  const contractRequest = raw.contract_request
    ? mapContractRequest(raw.contract_request)
    : undefined;

  return {
    id: raw.id,
    contractId: raw.contract_id,
    status: raw.status
      ? { code: raw.status.code as ContractStatusCodes }
      : undefined,
    stagedImport: raw.staged_import,
    contractRequest,
    renew: raw.renew,
    billingCycleMonths: raw.billing_cycle_months,
    calculatedCancelDate: raw.calculated_cancel_date,
    provisionSetupFieldsConfirmed: raw.provision_setup_fields_confirmed,
    inTrial: raw.in_trial,
    trialEndAction: raw.trial_end_action,
    nextDueDate: raw.next_due_date,
    importId: raw.import_id,
    moved: raw.moved,
    name: raw.name,
    canCancel: raw.can_cancel,
    isDelegatedObject: raw.is_delegated_object,
    autoCreateRenewInvoice: raw.auto_create_renew_invoice,
    unpaidRecurringInvoices: map(
      raw.unpaid_recurring_invoices,
      mapUnpaidInvoice
    ),
    scheduledActions: raw.scheduled_actions
      ? map(raw.scheduled_actions, mapScheduledAction)
      : undefined,
    isSubscription: raw.billing_cycle_months > 0,
    hasScheduledFutureCancellation:
      contractRequest?.status?.code ===
      CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
  };
}

function mapContractRequest(
  raw: IContractCancellationRequest
): ContractProductRequest {
  return {
    status: raw.status
      ? { code: raw.status.code as CancellationRequestStatusCodes }
      : undefined
  };
}

function mapScheduledAction(raw: IScheduledAction): ScheduledAction {
  return pick(raw, [
    "id",
    "action_code",
    "status",
    "executed_at",
    "created_at"
  ]);
}

function mapUnpaidInvoice(raw: IInvoice): UnpaidInvoice {
  return pick(raw, ["status"]);
}

// -----------------------------------------------------------------------------
// OUTBOUND — design 8.3, one mapper per write body

/** `requestSoftCancel` / `abortSoftCancel` wire body. */
export function toSoftCancelBody(model: SoftCancelModel): SoftCancelBody {
  return {
    renew: model.renew,
    ...(model.reason ? { cancellation_reason: model.reason } : {}),
    ...(model.customFields ? { custom_fields: model.customFields } : {})
  };
}

/** `setConsolidation` wire body. */
export function toConsolidationBody(
  model: SetConsolidationModel
): ConsolidationBody {
  return { invoice_consolidation_enabled: model.invoiceConsolidationEnabled };
}

/** `scheduleCancellation` wire body (R18). */
export function toScheduleCancellationBody(
  model: ScheduleCancellationModel
): ScheduleCancellationBody {
  return {
    future_cancellation_date: model.futureCancellationDate,
    ...(model.reason ? { cancellation_reason: model.reason } : {}),
    ...(model.customFields ? { custom_fields: model.customFields } : {})
  };
}
