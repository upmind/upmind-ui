// --- external
import { type JsonSchema, type UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "../../api/types";

// ---
// Contexts

export interface GuestContext {
  token: Token;
  error?: RequestError;
  // ---
  customFields: Array;
  model: AuthModel;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
}

export interface AuthModel {
  custom_fields: { [key: string]: number | string | boolean };
  username: string;
  firstname: string;
  lastname: string;
  password: string;
  phone: IPhone["phone"] | null;
  phone_code: IPhone["phone_code"] | null;
  phone_country_code: IPhone["phone_country_code"] | null;
  recaptcha_token: string;
}

// --------------------------------------------------------
// Events

export interface GuestEvents {
  type: "CHECK" | "LOGIN" | "LOGOUT";
  payload?: any;
}
