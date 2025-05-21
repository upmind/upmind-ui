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
  model: LoginModel | RegisterModel | TWOFAModel | RecoverModel;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
}

export interface LoginModel {
  username?: string;
  password?: string;
}

export interface RegisterModel {
  username?: string;
  firstname?: string;
  lastname?: string;
  password?: string;
  phone?: IPhoneData;
  customFields?: Record<string, any>;
}

export interface TWOFAModel {
  token?: string;
}

export interface RecoverModel {
  username?: string;
}
