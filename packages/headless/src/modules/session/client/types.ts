// --- internal

import type { Client, IAuthTransfer } from "../types";
import type { ResponseError } from "../../../utils";

// --- types
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export interface VerifyEmailModel {
  code?: string;
}

export interface ClientContext {
  client?: Client;
  error?: ResponseError;
  transfer?: IAuthTransfer;
  // ---
  model?: VerifyEmailModel;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
}
