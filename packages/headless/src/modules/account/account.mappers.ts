/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module account/mappers
 * @description Account model mappers.
 */
import type { CompleteRegistrationModel } from "./account.types";
// -----------------------------------------------------------------------------

/**
 * Map complete registration model to API request data.
 */
export function mapCompleteRegistrationData(
  model: CompleteRegistrationModel & { username?: string }
): Record<string, unknown> {
  const email = model.email ?? model.username;
  return {
    custom_fields: model.customFields,
    email,
    firstname: model.firstname,
    lastname: model.lastname,
    password: model.password,
    phone: model.phone?.nationalNumber,
    phone_code: model.phone?.countryCallingCode,
    phone_country_code: model.phone?.country,
    username: email
  };
}
