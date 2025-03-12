// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal

// ---  ENUMS

// ---  private

export interface IBillingDetail {
  addressId?: string;
  companyId?: string;
}

// ---  Contexts

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
  // TODO:
  // error?: RequestError;
  error?: any;
}
