// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { QueryResponseError } from "../../query";

// --- internal

// -----------------------------------------------------------------------------

export interface IBillingDetail {
  addressId?: string;
  companyId?: string;
}

export interface BillingDetailsContext {
  basketId?: string;
  clientId?: string;
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IBillingDetail;
  // ---
  addresses?: any[];
  companies?: any[];
  // ---
  autoupdate?: boolean;
  dirty?: boolean;
  error?: QueryResponseError;
}
