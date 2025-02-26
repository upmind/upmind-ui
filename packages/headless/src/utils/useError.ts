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

export class DetailedError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}
