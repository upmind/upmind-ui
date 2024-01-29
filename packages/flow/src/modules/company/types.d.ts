// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

interface ICompany {
  id: string;
  // ---
  name: string | null;
  address: IAddress;
  address_id: IAddress["id"];
  email: IEmail;
  email_id: IEmail["id"] | null;
  phone: IPhone;
  phone_id: IPhone["id"];
  reg_number: string | null;
  vat_number: string | null;
  vat_percent: string | null;
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

// --------------------------------------------------------
// Contexts

export interface CompanyContext {
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IAddress;
  // ---
  error?: RequestError;
}

export interface CompaniesContext {
  items?: IAddress[];
  selected?: IAddress;
  error?: RequestError;
}
// --------------------------------------------------------
// Events

export interface CompanyEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  error?: RequestError;
}

export interface CompaniesEvents {
  type: "ADD" | "SELECT" | "REFRESH" | "STOP";
  data: any;
  error?: RequestError;
}
