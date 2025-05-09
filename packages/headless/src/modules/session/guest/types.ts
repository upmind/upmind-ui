// --- types
import type { IPhoneData } from "../../client/phone/types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export interface GuestContext {
  // TODO:
  // token: Token;
  // error?: RequestError;
  token: any;
  error?: any;
  // ---
  // TODO:
  // customFields: Array;
  customFields: any[];
  model: any; // AuthModel;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
}

export interface AuthModel {
  username?: string;
  firstname?: string;
  lastname?: string;
  password?: string;
  phone?: IPhoneData;
  recaptcha_token?: string;
  customFields?: Record<string, any>;
}
