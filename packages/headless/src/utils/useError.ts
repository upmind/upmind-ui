// --- utils
import { map, reduce, set, trimStart, isArray } from "lodash-es";

// --- types
import type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

export enum responseCodes {
  "OK" = 200,
  "No_Content" = 204,
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

// -----------------------------------------------------------------------------
export class UnavailableError extends Error {
  code: responseCodes;
  constructor() {
    super("The service is temprarily unavailable.");
    this.code = responseCodes.Service_Unavailable;
  }
}

export class DetailedError extends Error {
  code: number;
  data?: any;
  constructor(message: string, code: number, data?: any) {
    super(message);
    this.code = code;
    this.data = data;
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

export class UserIsNotAuthenticatedError extends Error {
  code: number;
  constructor() {
    super(
      "The user is not authenticated. Please make sure that you are logged in."
    );
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
