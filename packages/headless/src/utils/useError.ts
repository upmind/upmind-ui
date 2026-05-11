// --- external
import * as Sentry from "@sentry/vue";

// --- internal
import { useI18n } from "../modules";

// --- utils
import {
  flatMap,
  get,
  map,
  reduce,
  set,
  trimStart,
  isArray,
  isObject,
  isNil,
  isString,
  isNumber
} from "lodash-es";

// --- types
import type { ErrorObject } from "ajv";

export type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

export enum responseCodes {
  "Unknown" = 0,
  "Aborted" = 20,
  "OK" = 200,
  "No_Content" = 204,
  "Bad_Request" = 400,
  "Unauthorized" = 401,
  "Forbidden" = 403,
  "Not_Found" = 404,
  "Timeout" = 408,
  "Conflict" = 409,
  "Too_Many_Requests" = 429,
  "Unprocessable_Entity" = 422,
  // ---
  "Internal_Server_Error" = 500,
  "Bad_Gateway" = 502,
  "Service_Unavailable" = 503,
  "Gateway_Timeout" = 504
  // ---
}

export enum ErrorOrigin {
  "Upmind" = "upmind",
  "External" = "external",
  "Headless" = "headless"
}

export type ResponseError = {
  data: any | null;
  code: string | number;
  origin: ErrorOrigin;
  status: responseCodes | number;
  message: string;
};

// -----------------------------------------------------------------------------

export class DetailedError extends Error {
  code: number;
  data?: any;
  origin: ErrorOrigin;
  /**
   * Optional structured error code from the API response (e.g.
   * `"web_hosting::domain_register_only"`). Distinct from `code`, which is
   * the numeric HTTP status. Preserved here because `data` is later
   * mutated by error parsers — clients that need to branch on the API's
   * domain-specific code should read this field.
   */
  apiCode?: string;

  constructor(
    message: string,
    code: number,
    origin: ErrorOrigin,
    data?: any,
    apiCode?: string
  ) {
    super(message);
    this.code = code;
    this.data = data;
    this.origin = origin;
    this.apiCode = apiCode;

    Sentry.logger.error(message, { code, data, origin, apiCode });
  }
}

export class NotAuthenticatedError extends Error {
  code: number;
  origin: ErrorOrigin;
  constructor() {
    const { t } = useI18n();

    super(t("auth.login_to_continue"));
    this.code = responseCodes.Unauthorized;
    this.origin = ErrorOrigin.Upmind;

    Sentry.logger.error(t("auth.login_to_continue"), {
      code: this.code,
      data: null,
      origin: this.origin
    });
  }
}
// -----------------------------------------------------------------------------

export function unflattenErrors(data: any) {
  // rawErrors will return a flattened object path in dot notation, so we need to convert back it to an object
  // and then we 'pick' the products out of the object
  const parsed = reduce(
    data,
    (result, value, key) => set(result, key, value),
    {}
  ) as Record<string, any>;

  return parsed;
}

export function parseError(
  value: string | string[],
  key: string,
  external: boolean = true // we usually use this for Back end API errors, so we set it to true by default
): ErrorObject[] {
  const propertyName = trimStart(
    key.toString().replace(".", "/properties/"),
    "/"
  );

  const safeValue = isArray(value) ? value : [value];

  return map(safeValue, (message: string) => {
    return {
      instancePath: `/${propertyName}`, // AJV style path to the property in the schema
      message,
      // --- optional
      propertyName: propertyName,
      schemaPath: `#/properties/${propertyName}`,
      keyword: "",
      params: {},
      external: !!external
    } as ErrorObject;
  });
}

/**
 * Parses a scalar API error field into ErrorObject[].
 * e.g. { quantity: ["msg"] } → instancePath: /quantity
 */
export function parseScalarErrors(
  raw: any,
  apiField: string,
  schemaPath: string
): ErrorObject[] {
  const messages = get(raw, apiField);
  if (isNil(messages)) return [];
  return parseError(messages, schemaPath);
}

/**
 * Parses a nested keyed API error field into ErrorObject[].
 * e.g. { provision_field_values: { hostname: ["msg"] } } → instancePath: /provisionFields/hostname
 */
export function parseNestedErrors(
  raw: any,
  apiField: string,
  schemaPath: string
): ErrorObject[] {
  const section = get(raw, apiField);
  if (isNil(section)) return [];
  return flatMap(section, (messages: string | string[], key: string) =>
    parseError(messages, `${schemaPath}/${key}`)
  );
}

// --- { options: [{ product_id: ["msg"] }] } → instancePath: /options
export function parseArrayErrors(
  raw: any,
  apiField: string,
  schemaPath: string
): ErrorObject[] {
  const entries = get(raw, apiField);
  if (isNil(entries) || !isArray(entries)) return [];
  return flatMap(entries, (entry: any) => {
    if (isNil(entry)) return [];
    return flatMap(entry, (messages: string | string[]) => {
      if (!isString(messages) && !isArray(messages)) return [];
      return parseError(messages, schemaPath);
    });
  });
}

/**
 * Maps various error types to a standardized ResponseError format.
 *
 * This function handles:
 * - Standard JavaScript `Error` objects
 * - Your custom error classes (`UnavailableError`, `DetailedError`, etc.)
 * - Raw string errors
 * - Plain objects that conform to a partial `ResponseError` structure
 *
 * @see {@link ResponseError}
 * @param {unknown} error The error to map. Can be an Error object, a string, or an object with error/message details.
 * @param {number | responseCodes} fallbackCode A fallback response code to use if the error doesn't provide one.
 * @returns {ResponseError} The mapped error object.
 */
export function mapToHeadlessError(
  error: unknown,
  fallbackCode: number | responseCodes = responseCodes.Unknown
): ResponseError | undefined {
  if (error instanceof DetailedError) {
    return {
      code: error.code,
      data: error?.data ?? null,
      message: error.message,
      origin: error.origin, // Use the origin from DetailedError
      status: error.code
    };
  } else if (error instanceof NotAuthenticatedError) {
    return {
      code: error.code,
      data: null,
      message: error.message,
      origin: error.origin,
      status: error.code
    };
  } else if (error instanceof TypeError) {
    // bail out early if the error is empty
    return {
      code: fallbackCode,
      message: error.message,
      status: fallbackCode,
      data: error.cause ?? error.stack,
      origin: ErrorOrigin.Headless
    };
  } else if (error instanceof Error) {
    return {
      code: fallbackCode,
      data: null,
      message: error.message,
      origin: ErrorOrigin.Headless,
      status: fallbackCode
    };
  } else if (isString(error)) {
    return {
      code: fallbackCode,
      data: null,
      message: error,
      origin: ErrorOrigin.Headless,
      status: fallbackCode
    };
  } else if (isObject(error)) {
    // assume that if we have an object it sis likely a Response Error
    // or at least contains some of the properties of our response error
    const partial = error as Partial<ResponseError>;

    return {
      code: partial?.code ?? fallbackCode,
      message: partial?.message ?? "An unknown error occurred.",
      status: partial?.status ?? fallbackCode,
      data: partial?.data ?? null,
      origin: partial?.origin ?? discernOrigin(partial?.code ?? partial?.status)
    };
  }

  // our catch-all for any other type of error
  return {
    code: fallbackCode,
    data: null,
    message: "An unknown error occurred.",
    origin: ErrorOrigin.Headless,
    status: fallbackCode
  };
}

function discernOrigin(status: unknown): ErrorOrigin {
  if (isNumber(status) && status >= 400 && status < 600) {
    return ErrorOrigin.Upmind; // Assuming 5xx are external/backend issues
  } else {
    return ErrorOrigin.Headless; // Default for unidentifiable status
  }
}
