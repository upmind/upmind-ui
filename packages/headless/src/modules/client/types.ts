// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "..//api/types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

// --------------------------------------------------------
// Contexts

export interface ClientItemContext {
  title?: string;
  description?: string;
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IAddress;
  // ---
  error?: RequestError;
}

export interface ClientListingsContext {
  initial?: string;
  filters: any;
  items?: IAddress[] | ICompany[] | IEmail[] | IPhone[];
  raw?: IAddress[] | ICompany[] | IEmail[] | IPhone[];
  selected?: IAddress;
  error?: RequestError;
}
// --------------------------------------------------------
// Events

export interface ClientItemEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  error?: RequestError;
}

export interface ClientListingsEvents {
  type: "ADD" | "SELECT" | "REFRESH" | "STOP";
  data: any;
  error?: RequestError;
}
