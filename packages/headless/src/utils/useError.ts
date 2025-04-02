// ---
export enum responseCodes {
  "OK" = 200,
  "No_Content" = 204,
  "Unauthorized" = 401,
  "Forbidden" = 403,
  "Not_Found" = 404,
  "Conflict" = 409,
  "Too_Many_Requests" = 429,
  "Unprocessable_Entity" = 422,
}

// -----------------------------------------------------------------------------

export class DetailedError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export class CacheIsStaleError extends Error {
  code: number;
  constructor() {
    super("The data is stale. Please make sure that you refresh the data.");
    this.code = responseCodes.Conflict;
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
