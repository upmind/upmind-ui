/** @internal */
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes
} from "@upmind-automation/types";
import { parseBillingCycle } from "../product";
import { useDate, useTranslateName } from "../../utils";
import { castArray, get, map } from "lodash-es";
import type {
  Contract,
  ContractCancellationRequestMeta,
  ContractMeta,
  ContractProductListItem,
  SetPaymentMethodBody,
  SetPaymentMethodModel
} from "./contract.types";
import type { LookupItem } from "../lookup";
import type {
  IContract,
  IContractProduct,
  IStatus
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.mappers
 * @description Wire ↔ view-model shaping for contracts (design 8.10, R19).
 * Pure — no side effects, no HTTP, never actor-scoped.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useContracts.ts` / `useContract.ts` only (`@internal/no-cross-module-imports`).
 */

/**
 * What a client recognises a contract by (R38 item 8): its name when it has
 * one, else its order number as legacy titles it (`#main_invoice_number`).
 * @returns `undefined` when the record carries neither.
 */
export function mapContractTitle(raw: IContract): string | undefined {
  if (raw.name) return raw.name;
  return raw.main_invoice_number ? `#${raw.main_invoice_number}` : undefined;
}

/** The translated-badge flags for a contract's own `status.code` (R38 item 9, G2). */
export function mapContractMeta(code: ContractStatusCodes): ContractMeta {
  return {
    isActive: code === ContractStatusCodes.ACTIVE,
    isAwaitingActivation: code === ContractStatusCodes.AWAITING_ACTIVATION,
    isCancelled: code === ContractStatusCodes.CANCELLED,
    isClosed: code === ContractStatusCodes.CLOSED,
    isFraud: code === ContractStatusCodes.FRAUD,
    isPending: code === ContractStatusCodes.PENDING,
    isSuspended: code === ContractStatusCodes.SUSPENDED
  };
}

/** The translated-badge flags for a cancellation request's own `status.code` (R38 item 9, G2). */
export function mapContractCancellationRequestMeta(
  code: CancellationRequestStatusCodes | undefined
): ContractCancellationRequestMeta {
  return {
    isAccepted: code === CancellationRequestStatusCodes.REQUEST_ACCEPTED,
    isCancellationRequest:
      code === CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST,
    isEndOfBillingCycle:
      code === CancellationRequestStatusCodes.REQUEST_END_OF_BILLING_CYCLE,
    isEndOfBillingCycleUnacknowledged:
      code ===
      CancellationRequestStatusCodes.REQUEST_END_OF_BILLING_CYCLE_UNACKNOWLEDGED,
    isScheduledFutureCancellation:
      code ===
      CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
  };
}

/**
 * The translated billing-cycle label (R38 item 10, GAP-02) — the same
 * `parseBillingCycle` reading `contract-product.mappers.ts` uses: legacy's
 * cycle name for a subscription, "One time" for a one-time contract.
 */
export function mapContractBillingCycle(months: number): string {
  const cycle = parseBillingCycle(months);
  return months > 0 ? cycle.adverbial : cycle.descriptive;
}

/**
 * One of a contract's products as its list row names it (R34): its id, its own
 * `name`, and its catalogue product's `name`. NOT a full `ContractProduct` —
 * each product loads itself through `useContractProduct`.
 */
export function mapContractProductListItem(
  raw: IContractProduct
): ContractProductListItem {
  return {
    id: raw.id,
    name: raw.name,
    ...(raw.product ? { product: { name: raw.product.name } } : {}),
    isDelegatedObject: !!raw.is_delegated_object
  };
}

/** Maps one wire record to the view model. */
export function mapContract(raw: IContract): Contract {
  const requestStatus = get(raw, "cancellation_request.status") as
    | IStatus
    | undefined;
  const requestCode = requestStatus?.code as
    | CancellationRequestStatusCodes
    | undefined;
  const requestMeta = mapContractCancellationRequestMeta(requestCode);

  return {
    id: raw.id,
    status: {
      code: raw.status.code as ContractStatusCodes,
      name: useTranslateName(raw.status)
    },
    meta: {
      ...mapContractMeta(raw.status.code as ContractStatusCodes),
      ...requestMeta
    },
    ...(requestCode
      ? {
          cancellationRequest: {
            status: {
              code: requestCode,
              name: useTranslateName(requestStatus)
            },
            meta: requestMeta
          }
        }
      : {}),
    paymentDetailsId: raw.payment_details_id,
    products: map(raw.products, mapContractProductListItem),
    name: raw.name,
    title: mapContractTitle(raw),
    nextDueDate: raw.next_due_date,
    dateNextDue: useDate(raw.next_due_date, undefined, "MMM Do, YYYY"),
    billingCycleMonths: raw.billing_cycle_months,
    billingCycleLabel: mapContractBillingCycle(raw.billing_cycle_months),
    purchaseDate: raw.start_date,
    datePurchased: useDate(raw.start_date, undefined, "MMM Do, YYYY"),
    totalAmountFormatted: raw.total_amount_formatted,
    raw
  };
}

/** Maps the list response to the view-model collection. */
export function mapContracts(raw: IContract | IContract[]): Contract[] {
  return map(castArray(raw), mapContract);
}

/**
 * One contract as a picker option (R38 item 7), labelled by `mapContractTitle`
 * — the reading `useContract`'s own `title` uses — or the id when it has none.
 */
export function mapContractLookupItem(raw: IContract): LookupItem {
  return {
    value: raw.id,
    label: mapContractTitle(raw) ?? raw.id,
    description: raw.status?.code ?? undefined
  };
}

/** The contracts picker query's `select` — every row as a selectable option. */
export function mapContractLookupItems(raw: IContract[] = []): LookupItem[] {
  return map(raw, mapContractLookupItem);
}

/** Maps the payment-method model to the `PATCH payment_details` body (design 8.3). */
export function toPaymentMethodBody(
  model: SetPaymentMethodModel
): SetPaymentMethodBody {
  return { payment_details_id: model.paymentDetailsId };
}
