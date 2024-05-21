// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

interface IPhone {
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
  client_id: IClient["id"];
  created_at: string | null;
  deleted_at: null;
  updated_at: Date | string | null;
  user_id: IUser["id"];
  verified: number | null;
}

interface IPhoneData {
  nationalNumber: string;
  countryCallingCode: string;
  country: string;
}

// --------------------------------------------------------
// Contexts

export interface PhoneContext {
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IAddress;
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface PhoneEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  error?: RequestError;
}
