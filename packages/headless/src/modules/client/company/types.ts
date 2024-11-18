// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "../..//api/types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface ICompany {
  id: string;
  // ---
  name: string | null;
  // TODO:
  // address: IAddress;
  // address_id: IAddress["id"];
  // email: IEmail;
  // email_id: IEmail["id"] | null;
  // phone: IPhone;
  // phone_id: IPhone["id"];
  address: any;
  address_id: any["id"];
  email: any;
  email_id: any["id"] | null;
  phone: any;
  phone_id: any["id"];
  reg_number: string | null;
  vat_number: string | null;
  // vat_percent: string | null;
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

// --------------------------------------------------------
// Contexts

export interface CompanyContext {
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

export interface CompanyEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}
