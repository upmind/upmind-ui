import {
  CancellationRequestStatusCodes,
  ContractStatusCodes
} from "@upmind-automation/types";
import { useI18n } from "../system-localisation";
import { ContractState } from "./contract.types";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useValidation
} from "../../utils";
import { get, isEmpty } from "lodash-es";
import type { Contract, ContractForm } from "./contract.types";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.utils
 * @description Pure readings over the `Contract` view model.
 */

/**
 * Selects the node of `contract.machine.ts` a contract sits in, in the entry
 * order of flow.md section 3: `unavailable` first, then `cancelling`, then the
 * four `available` status nodes.
 * @returns the node, or `undefined` for a status code outside the seven the
 * platform publishes — never throws.
 */
export function selectContractStatusNode(
  contract: Contract
): ContractState | undefined {
  const code = contract.status.code;

  if (code === ContractStatusCodes.CANCELLED) return ContractState.CANCELLED;
  if (code === ContractStatusCodes.CLOSED) return ContractState.LAPSED;
  if (code === ContractStatusCodes.FRAUD) return ContractState.FRAUD;

  if (
    get(contract, "cancellationRequest.status.code") ===
    CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
  ) {
    return ContractState.CANCELLING;
  }

  switch (code) {
    case ContractStatusCodes.PENDING:
      return ContractState.PENDING;
    case ContractStatusCodes.AWAITING_ACTIVATION:
      return ContractState.INACTIVE;
    case ContractStatusCodes.ACTIVE:
      return ContractState.ACTIVE;
    case ContractStatusCodes.SUSPENDED:
      return ContractState.SUSPENDED;
    default:
      return undefined;
  }
}

// -----------------------------------------------------------------------------
// Write form

/** Rejects with a 422 carrying the AJV errors when the form's model is invalid. */
export async function validateForm({
  schema,
  model
}: ContractForm = {}): Promise<void> {
  if (!schema) return;

  const { validate } = useValidation();
  const errors = validate(schema, model);

  if (!isEmpty(errors)) {
    throw new DetailedError(
      useI18n().t("error.contract_validation_failed"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      errors
    );
  }
}
