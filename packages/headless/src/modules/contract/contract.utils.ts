import { useI18n } from "../system-localisation";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useValidation
} from "../../utils";
import { isEmpty } from "lodash-es";
import type { ContractForm } from "./contract.types";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.utils
 * @description Pure readings over the `Contract` view model.
 */

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
