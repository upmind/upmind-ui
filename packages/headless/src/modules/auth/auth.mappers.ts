/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/mappers
 * @description Auth model mappers.
 */
import { AccessRoleTypes, TwofaProviders } from "@upmind-automation/types";
import { useI18n } from "../system-localisation";
import { DetailedError, mapToHeadlessError } from "../../utils";
import {
  floor,
  get,
  isNil,
  isString,
  isUndefined,
  replace,
  some,
  startsWith,
  toLower,
  toNumber,
  trim,
  values
} from "lodash-es";
import type {
  LoginModel,
  RecoverModel,
  RegisterModel,
  VerifyRegistrationData,
  VerifyRegistrationError,
  VerifyRegistrationTwoFAProvider
} from "./auth.types";
import type { GrantTypes, IToken } from "@upmind-automation/types";
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

// -----------------------------------------------------------------------------
/**
 * Whether a lower-cased provider name is one the API is known to send.
 * @private
 */
function isTwoFAProvider(
  value: string
): value is Exclude<VerifyRegistrationTwoFAProvider, ""> {
  return some(values(TwofaProviders), known => toLower(known) === value);
}

/**
 * Narrow an API provider name to the published union, or `""` when it is absent
 * or unknown.
 * @private
 */
function toTwoFAProvider(value: unknown): VerifyRegistrationTwoFAProvider {
  const provider = toLower(isString(value) ? value : "");
  return isTwoFAProvider(provider) ? provider : "";
}

/**
 * Map the unwrapped registration verify answer, with the legacy defaults for
 * each absent field.
 * @throws {TypeError} when the value is `null` or `undefined`.
 */
export function mapVerifyRegistration(value: unknown): VerifyRegistrationData {
  if (isNil(value)) {
    const { t } = useI18n();
    throw new TypeError(t("error.session_verify_link_invalid"));
  }

  return {
    needsPassword: !get(value, "has_password", false),
    needsCompleteStep: !get(value, "has_name", false),
    twoFARequired: !!get(value, "twofa_enabled", false),
    twoFAProvider: toTwoFAProvider(get(value, "twofa_provider"))
  };
}

/**
 * Coerce a `complete_registration` grant token to the CLIENT actor.
 */
export function mapRegistrationToken(token: IToken): IToken {
  return { ...token, actor_type: AccessRoleTypes.CLIENT };
}

/**
 * Map a landing failure to the published error, keeping the API code.
 */
export function mapVerifyRegistrationError(
  error: unknown
): VerifyRegistrationError | undefined {
  const mapped = mapToHeadlessError(error);
  if (!mapped) return mapped;
  return error instanceof DetailedError
    ? { ...mapped, apiCode: error.apiCode }
    : mapped;
}
// -----------------------------------------------------------------------------
const REDIRECT_BASE = "https://verify-landing.invalid";
// C0 controls, space and DEL, written as the complement of the printable range.
const REDIRECT_UNSAFE_CHARACTERS = /[^\x21-\x7E\x80-\uFFFF]|\s/;
const REDIRECT_BLOCKED_ROUTES =
  /^(\/auth)?\/(login|register|forgotten-password|reset-password|verify|relay|logout)/i;

/**
 * Filter a link `redirect` value to a same-app path.
 * @returns the path with leading backslashes stripped, or `undefined` when the
 * value can leave the app origin or targets an auth route.
 */
export function toSafeRedirect(raw: unknown): string | undefined {
  if (!isString(raw) || !raw || REDIRECT_UNSAFE_CHARACTERS.test(raw)) return;
  if (REDIRECT_BLOCKED_ROUTES.test(raw)) return;

  const value = replace(raw, /^\\+/, "");
  if (!/^\/(?![/\\])/.test(value)) return;

  try {
    const url = new URL(value, REDIRECT_BASE);
    if (url.origin !== REDIRECT_BASE || startsWith(url.pathname, "//")) return;
  } catch {
    return;
  }

  return value;
}
// -----------------------------------------------------------------------------
const EXPIRY_EXTENDED =
  /^\s*(\d{4})-(\d{2})(?:-(\d{2})(?:[T ](\d{2})(?::(\d{2})(?::(\d{2})(?:[.,](\d+))?)?)?(\s*Z|[+-]\d{2}(?::?\d{2})?)?)?)?$/;
const EXPIRY_BASIC =
  /^\s*(\d{4})(?:(\d{2})|(\d{2})(\d{2})(?:[T ](\d{2})(?:(\d{2})(?:(\d{2})(?:[.,](\d+))?)?)?(\s*Z|[+-]\d{2}(?::?\d{2})?)?)?)?$/;
const EXPIRY_OFFSET = /^([+-])(\d{2}):?(\d{2})?$/;

/**
 * Split an ISO calendar value into its fields, or `undefined` when it matches
 * neither the extended nor the basic form.
 * @private
 */
function expiryFields(value: string): (string | undefined)[] | undefined {
  const extended = EXPIRY_EXTENDED.exec(value);
  if (extended) return extended.slice(1, 9);

  const basic = EXPIRY_BASIC.exec(value);
  if (!basic) return;
  if (!isUndefined(basic[2])) return [basic[1], basic[2]];
  return basic.slice(1, 2).concat(basic.slice(3, 10));
}

/**
 * Days in a Gregorian month.
 * @private
 */
function daysInMonth(year: number, month: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
    month - 1
  ];
}

/**
 * Whether a link `expires` value names an instant that is not after `now`.
 * Only ISO calendar values are read; every other value is not expired.
 */
export function isLinkExpired(value: unknown, now: Date): boolean {
  if (!isString(value)) return false;

  const fields = expiryFields(value);
  if (!fields) return false;

  const [year, month, day, hour, minute, second, fraction, zone] = fields;
  const Y = toNumber(year);
  const M = isUndefined(month) ? 1 : toNumber(month);
  const D = isUndefined(day) ? 1 : toNumber(day);
  const h = isUndefined(hour) ? 0 : toNumber(hour);
  const mi = isUndefined(minute) ? 0 : toNumber(minute);
  const s = isUndefined(second) ? 0 : toNumber(second);
  const ms = isUndefined(fraction)
    ? 0
    : floor(toNumber(`0.${fraction}`) * 1000);

  if (M < 1 || M > 12 || D < 1 || D > daysInMonth(Y, M)) return false;
  if (mi > 59 || s > 59 || h > 24 || (h === 24 && (mi || s || ms)))
    return false;

  const tz = trim(zone ?? "");
  const offset = EXPIRY_OFFSET.exec(tz);
  const offsetMinutes = offset
    ? (offset[1] === "-" ? -1 : 1) *
      (toNumber(offset[2]) * 60 + toNumber(offset[3] ?? 0))
    : 0;

  const instant = new Date(0);
  instant.setUTCFullYear(Y, M - 1, D);
  instant.setUTCHours(h, mi, s, ms);

  return instant.getTime() - offsetMinutes * 60000 <= now.getTime();
}
