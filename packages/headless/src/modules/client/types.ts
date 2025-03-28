// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { ActorRef } from "xstate";
// -----------------------------------------------------------------------------
// Contexts

export interface ClientItemContext {
  id?: string;
  title?: string;
  description?: string;
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  baseModel?: any;
  model?: any;
  error?: any;
}

export interface ClientListingsContext {
  selected?: ActorRef<any | any> | any;
  error?: any;
  initial?: string;
  filters: any;
  items?: ActorRef<any | any>[]; //IAddress[] | ICompany[] | IEmail[] | IPhone[];
  raw?: ActorRef<any | any>[]; //IAddress[] | ICompany[] | IEmail[] | IPhone[];
}
