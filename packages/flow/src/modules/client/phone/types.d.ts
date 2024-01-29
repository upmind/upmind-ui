// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

interface IPhone {
  id: string;
  // ---
  bounced: boolean;
  bounced_at: string | null;
  phone: string;
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
