// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

interface IEmail {
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
  client_id: IClient["id"];
  created_at: string | null;
  deleted_at: null;
  updated_at: Date | string | null;
  user_id: IUser["id"];
  verified: number | null;
}

// --------------------------------------------------------
// Contexts

export interface EmailContext {
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IAddress;
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface EmailEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  error?: RequestError;
}
