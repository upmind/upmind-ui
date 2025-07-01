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
  toNumber
} from "lodash-es";

// --- types
import type { ErrorObject } from "ajv";

export type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

export enum responseCodes {
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
      external: !!external
    } as ErrorObject;
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
  fallbackCode: number | responseCodes = responseCodes.Internal_Server_Error
): ResponseError {
  let code: string | number | responseCodes = fallbackCode;
  let data: any | null = null;
  let status: number | responseCodes = fallbackCode;
  let message: string = "An unknown error occurred.";
  let origin: ErrorOrigin = ErrorOrigin.Headless; // Default origin to 'Headless' or 'Unknown'

  if (error instanceof DetailedError) {
    code = error.code;
    status = error.code;
    message = error.message;
    data = error.data !== undefined ? error.data : null;
    origin = error.origin; // Use the origin from DetailedError
  } else if (error instanceof UnavailableError) {
    code = error.code;
    status = error.code;
    message = error.message;
    origin = ErrorOrigin.Upmind;
  } else if (error instanceof CacheIsStaleError) {
    code = error.code;
    status = error.code;
    message = error.message;
    origin = ErrorOrigin.Headless;
  } else if (error instanceof NotAuthenticatedError) {
    code = error.code;
    status = error.code;
    message = error.message;
    origin = ErrorOrigin.Headless;
  } else if (error instanceof CacheIsNotAvailableError) {
    code = error.code;
    status = error.code;
    message = error.message;
    origin = ErrorOrigin.Headless;
  } else if (error instanceof Error) {
    // Generic Error object
    message = error.message;
    // For generic Error, we can't infer much, default to Headless
    origin = ErrorOrigin.Headless;
  } else if (isString(error)) {
    // Raw string error
    message = error;
    origin = ErrorOrigin.Headless; // Assume it's an internal string error
  } else if (!isNil(error) && isObject(error)) {
    // Try to parse it as a partial ResponseError or an API error object
    const detailedError = error as Partial<ResponseError>;

    if (detailedError.code !== undefined) {
      code = detailedError.code;
    }
    if (detailedError.message !== undefined) {
      message = detailedError.message;
    }
    if (detailedError.status !== undefined) {
      status = detailedError.status;
    } else if (isNumber(code) || (isString(code) && !isNaN(toNumber(code)))) {
      // Only set status from code if code is a number or a string representation of a number
      status = toNumber(code);
    }

    if (detailedError.data !== undefined) {
      data = detailedError.data;
    } else {
      data = null;
    }

    if (detailedError.origin !== undefined) {
      origin = detailedError.origin;
    } else {
      // Attempt to infer origin for generic objects, e.g., if status is 5xx -> External/Upmind, 4xx -> Headless
      if (isNumber(status) && status >= 500 && status < 600) {
        origin = ErrorOrigin.External; // Assuming 5xx are external/backend issues
      } else if (isNumber(status) && status >= 400 && status < 500) {
        origin = ErrorOrigin.Headless; // Assuming 4xx originate from how Headless used an API or bad request from client
      } else {
        origin = ErrorOrigin.Headless; // Default for unidentifiable status
      }
    }
  }

  // Final check to ensure status is a number (or responseCodes enum member)
  if (!isNumber(status)) {
    // If status ended up not being a number, fall back
    status = fallbackCode;
  }

  return { code, data, origin, status, message };
}
