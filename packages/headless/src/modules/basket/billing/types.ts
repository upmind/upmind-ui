// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { QueryResponseError } from "../../query";

// --- internal

// -----------------------------------------------------------------------------

export interface BillingDetailsModel {
  addressId?: string;
  companyId?: string;
  phoneId?: string;
}

export interface BillingDetailsContext {
  basketId?: string;
  clientId?: string;
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: BillingDetailsModel;
  // ---
  addresses?: any[];
  companies?: any[];
  phones?: any[];
  // ---
  autoupdate?: boolean;
  dirty?: boolean;
  error?: QueryResponseError;
}
