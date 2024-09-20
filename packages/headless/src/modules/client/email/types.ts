// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IEmail {
  id: string;
  // ---
  bounced: boolean;
  bounced_at: string | null;
  email: string;
  type: number;
  // ---
  default: boolean;
  // --- readonly/system data
  can_delete: boolean;
  // TODO:
  // client_id: IClient["id"];
  client_id: any;
  created_at: string | null;
  deleted_at: null;
  updated_at: Date | string | null;
  // TODO:
  // user_id: IUser["id"];
  user_id: any;
  verified: number | null;
}

// --------------------------------------------------------
// Contexts

export interface EmailContext {
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

export interface EmailEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}
