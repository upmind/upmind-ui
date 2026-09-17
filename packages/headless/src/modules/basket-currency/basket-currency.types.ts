import type { ResponseError } from "../../utils";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ICurrency } from "@upmind-automation/types";
import type { ActorRef, AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export type CurrencyModel = {
  id?: ICurrency["id"];
  code?: ICurrency["code"];
};

export interface CurrencyContext {
  basketId?: string;
  // ---
  currencies?: ICurrency[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: CurrencyModel;
  baseModel?: CurrencyModel;
  autoupdate?: boolean;
  // ---
  authHelper?: ActorRef<AnyEventObject>;
  error?: ResponseError;
}
