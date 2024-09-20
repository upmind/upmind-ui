// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IPhone {
  id: string;
  // ---
  full_phone: string;
  international_phone: string;
  phone: string | null;
  phone_code: string;
  phone_country_code: string;
  type: number | null;
  // ---
  default: boolean;
  // --- readonly/system data
  can_delete: boolean;
  // TODO:
  // client_id: IClient["id"];
  client_id: any["id"];
  created_at: string | null;
  deleted_at: null;
  updated_at: Date | string | null;
  // TODO:
  // user_id: IUser["id"];
  user_id: any["id"];
  verified: number | null;
}

export interface IPhoneData {
  nationalNumber: string;
  countryCallingCode: string;
  country: string;
}

// --------------------------------------------------------
// Contexts

export interface PhoneContext {
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  // TODO:
  // model?: IAddress;
  model?: any;
  // ---
  // TODO:
  // error?: RequestError;
  error?: any;
}

// --------------------------------------------------------
// Events

export interface PhoneEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}
