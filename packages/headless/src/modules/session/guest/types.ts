// --- external
import { type JsonSchema, type UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "../../api/types";

// ---
// Contexts

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
  model: AuthModel;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
}

export interface AuthModel {
  customFields: { [key: string]: number | string | boolean };
  username: string;
  firstname: string;
  lastname: string;
  password: string;
  // TODO:
  // phone: IPhone["phone"] | null;
  // phone_code: IPhone["phone_code"] | null;
  // phone_country_code: IPhone["phone_country_code"] | null;
  phone: any["phone"] | null;
  phone_code: any["phone_code"] | null;
  phone_country_code: any["phone_country_code"] | null;
  recaptcha_token: string;
}

// --------------------------------------------------------
// Events

export interface GuestEvents {
  type: "CHECK" | "LOGIN" | "LOGOUT";
  payload?: any;
}
