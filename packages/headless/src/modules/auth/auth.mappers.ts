/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/mappers
 * @description Auth model mappers.
 */
import type { LoginModel, RecoverModel, RegisterModel } from "./auth.types";
import type { GrantTypes } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * Map login model to API request data.
 */
export function mapLoginData(
  model: LoginModel | undefined,
  grantType: GrantTypes
): Record<string, unknown> {
  return {
    username: model?.username,
    password: model?.password,
    grant_type: grantType
  };
}

/**
 * Map register model to API request data.
 */
export function mapRegisterData(
  model: RegisterModel | undefined
): Record<string, unknown> {
  return {
    custom_fields: model?.customFields,
    email: model?.username,
    username: model?.username,
    firstname: model?.firstname,
    lastname: model?.lastname,
    password: model?.password,
    phone: model?.phone?.nationalNumber,
    phone_code: model?.phone?.countryCallingCode,
    phone_country_code: model?.phone?.country
  };
}

/**
 * Map recover model to API request data.
 */
export function mapRecoverData(
  model: RecoverModel | undefined
): Record<string, unknown> {
  return {
    username: model?.username
  };
}
