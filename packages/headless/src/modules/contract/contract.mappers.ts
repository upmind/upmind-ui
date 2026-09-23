/** @internal */
import { mapContractProduct } from "../contract-product";
import { castArray, get, isEmpty, map } from "lodash-es";
import type {
  Contract,
  RequestCancellationBody,
  RequestCancellationModel,
  SetPaymentMethodBody,
  SetPaymentMethodModel
} from "./contract.types";
import type {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  IContract
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

/** Maps one wire record to the view model. */
export function mapContract(raw: IContract): Contract {
  const requestCode = get(raw, "cancellation_request.status.code") as
    | CancellationRequestStatusCodes
    | undefined;

  return {
    id: raw.id,
    status: { code: raw.status.code as ContractStatusCodes },
    ...(requestCode
      ? { cancellationRequest: { status: { code: requestCode } } }
      : {}),
    paymentDetailsId: raw.payment_details_id,
    products: map(raw.products, mapContractProduct),
    raw
  };
}

/** Maps the list response to the view-model collection. */
export function mapContracts(raw: IContract | IContract[]): Contract[] {
  return map(castArray(raw), mapContract);
}

/**
 * Maps the cancellation-request model to the `POST cancel/request` body
 * (design 8.3).
 *
 * @decision
 * what: `customFields` (a `CustomFieldModel` code→value map) is sent straight
 *   through as `custom_fields`, not routed through
 *   `mapCustomFieldValuesToRequest`.
 * why: that helper is a DIRTY-DIFF updater — it compares a model against a
 *   base model and drops unchanged keys. A cancellation request is a fresh
 *   submission with no base model, so every field is intended; diffing would
 *   silently strip fields whose value equals a `""`/`undefined` base. Legacy
 *   sends the code→value object as-is (`contractCancellation.ts:696-705`).
 * rejected: `mapCustomFieldValuesToRequest(model.customFields)` — its
 *   empty-diff `undefined` return and `""→null` coercion belong to the
 *   value-editor edit flow, not a create.
 */
export function toRequestCancellationBody(
  model: RequestCancellationModel
): RequestCancellationBody {
  return {
    product_ids: model.productIds,
    ...(model.reason ? { cancellation_reason: model.reason } : {}),
    ...(isEmpty(model.customFields)
      ? {}
      : { custom_fields: model.customFields })
  };
}

/** Maps the payment-method model to the `PATCH payment_details` body (design 8.3). */
export function toPaymentMethodBody(
  model: SetPaymentMethodModel
): SetPaymentMethodBody {
  return { payment_details_id: model.paymentDetailsId };
}
