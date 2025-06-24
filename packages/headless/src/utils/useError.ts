// --- utils
import {
  map,
  reduce,
  set,
  trimStart,
  isArray,
  isObject,
  isNil,
  isString,
  isNumber,
  toNumber,
} from "lodash-es";

// --- types
import type { ErrorObject } from "ajv";
import { QueryResponseError } from "../modules";

export type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

export enum responseCodes {
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
  "Gateway_Timeout" = 504,
  // ---
}

export enum ErrorOrigin {
  "Upmind" = "upmind",
  "External" = "external",
  "Headless" = "headless",
}

// -----------------------------------------------------------------------------
export class UnavailableError extends Error {
  code: responseCodes;
  constructor() {
    super("The service is temporarily unavailable.");
    this.code = responseCodes.Service_Unavailable;
  }
}

export class DetailedError extends Error {
  code: number;
  data?: any;
  origin: ErrorOrigin;

  constructor(message: string, code: number, origin: ErrorOrigin, data?: any) {
    super(message);
    this.code = code;
    this.data = data;
    this.origin = origin;
  }
}

export class CacheIsStaleError extends Error {
  code: number;
  constructor() {
    super("The data is stale. Please make sure that you refresh the data.");
    this.code = responseCodes.Unprocessable_Entity;
  }
}

export class CacheIsNotAvailableError extends Error {
  code: number;
  constructor() {
    super(
      "The data is not ready yet. Please make sure that you requested data first."
    );
    this.code = responseCodes.Unprocessable_Entity;
  }
}

export class NotAuthenticatedError extends Error {
  code: number;
  constructor() {
    super("The user is not authenticated. Please log in to continue.");
    this.code = responseCodes.Unauthorized;
  }
}
// -----------------------------------------------------------------------------

export function unflattenErrors(data: any) {
  // rawErrors will return a flattened object path in dot notation, so we need to convert back it to an object
  // and then we 'pick' the products out of the object
  const parsed = reduce(
    data,
    (result, value, key) => set(result, key, value),
    []
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
      external: !!external,
    } as ErrorObject;
  });
}

/**
 * Maps various error types to a standardized QueryResponseError format.
 *
 * This function handles:
 * - Standard JavaScript `Error` objects
 * - Your custom error classes (`UnavailableError`, `DetailedError`, etc.)
 * - Raw string errors
 * - Plain objects that conform to a partial `ResponseError` structure
 *
 * @see {@link QueryResponseError}
 * @param {unknown} error The error to map. Can be an Error object, a string, or an object with error/message details.
 * @param {number | responseCodes} fallbackCode A fallback response code to use if the error doesn't provide one.
 * @returns {QueryResponseError} The mapped error object.
 */
export function mapToHeadlessError(
  error: unknown,
  fallbackCode: number | responseCodes = responseCodes.Internal_Server_Error
): QueryResponseError {
  let code: string | number | responseCodes = fallbackCode;
  let data: any | null = null;
  let status: number | responseCodes = fallbackCode;
  let message: string = "An unknown error occurred.";

  if (error instanceof DetailedError) {
    code = error.code;
    status = error.code; // DetailedError code is a number, likely an HTTP status
    message = error.message;
    data = error.data !== undefined ? error.data : null;
  } else if (
    error instanceof UnavailableError ||
    error instanceof CacheIsStaleError ||
    error instanceof NotAuthenticatedError ||
    error instanceof CacheIsNotAvailableError
  ) {
    code = error.code;
    status = error.code;
  } else if (error instanceof Error) {
    // Generic Error object, use fallback code/status
    message = error.message;
  } else if (isString(error)) {
    // Raw string error
    message = error;
  } else if (!isNil(error) && isObject(error)) {
    // Try to parse it as a partial ResponseError or an API error object
    const detailedError = error as Partial<QueryResponseError> & {
      code?: unknown;
      data?: unknown;
    };

    if (detailedError.code) {
      code = detailedError.code;
    }
    if (detailedError.message) {
      message = detailedError.message;
    }
    if (detailedError.status) {
      status = detailedError.status;
    } else if (isNumber(code) || isString(code)) {
      status = toNumber(code);
    }
    data = !isNil(detailedError.data) ? detailedError.data : null;
  }

  // Ensure the code is a string or a valid response code
  const type = code;

  return { id: null, code, type, data, status, message };
}
