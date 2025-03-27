// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { IClient } from "@upmind-automation/types";

// --- internal
import type { ActorRef } from "xstate";
// -----------------------------------------------------------------------------
// Contexts

export interface ClientItemContext {
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
  filters?: any;
  items?: ActorRef<any | any>[]; //IAddress[] | ICompany[] | IEmail[] | IPhone[];
  raw?: ActorRef<any | any>[]; //IAddress[] | ICompany[] | IEmail[] | IPhone[];
  queryHelper?: ActorRef<any | any>;
  queryKeys: string[];
  client?: IClient;
  authHelper?: ActorRef<any>;
}
