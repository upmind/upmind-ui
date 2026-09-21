/** @internal */
import { mapContractProduct } from "../contract-product";
import { castArray, get, map } from "lodash-es";
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
    products: map(raw.products, mapContractProduct)
  };
}

/** Maps the list response to the view-model collection. */
export function mapContracts(raw: IContract | IContract[]): Contract[] {
  return map(castArray(raw), mapContract);
}

/** Maps the cancellation-request model to the `POST cancel/request` body (design 8.3). */
export function toRequestCancellationBody(
  model: RequestCancellationModel
): RequestCancellationBody {
  return {
    product_ids: model.productIds,
    ...(model.reason ? { cancellation_reason: model.reason } : {}),
    ...(model.customFields ? { custom_fields: model.customFields } : {})
  };
}

/** Maps the payment-method model to the `PATCH payment_details` body (design 8.3). */
export function toPaymentMethodBody(
  model: SetPaymentMethodModel
): SetPaymentMethodBody {
  return { payment_details_id: model.paymentDetailsId };
}
