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
  // TODO:
  // model?: IAddress;
  model?: any;
  // ---
  // TODO:
  // error?: RequestError;
  error?: any;
}

export interface ClientListingsContext {
  initial?: string;
  filters: any;
  // TODO:
  // items?: IAddress[] | ICompany[] | IEmail[] | IPhone[];
  // raw?: IAddress[] | ICompany[] | IEmail[] | IPhone[];
  // selected?: IAddress;
  // error?: RequestError;
  items?: any[];
  raw?: any[];
  selected?: any;
  error?: any;
}
// --------------------------------------------------------
// Events

export interface ClientItemEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}

export interface ClientListingsEvents {
  type: "ADD" | "SELECT" | "REFRESH" | "STOP";
  data: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}
