// --- external
import { BrandConfigKeys } from "@upmind-automation/types";

// --- types
import type { IBasket } from "@upmind-automation/types";
import type { ResponseError } from "../../../utils";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

export { UnifiedType } from "./unified/types";
// --- internal

// -----------------------------------------------------------------------------

export interface BillingModel {
  addressId?: IBasket["address_id"] | null;
  companyId?: IBasket["company_id"] | null;
  phoneId?: IBasket["phone_id"] | null;
}

export interface BillingContext {
  basketId?: string;
  clientId?: string;
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: BillingModel;
  baseModel?: BillingModel;
  // ---
  config?: {
    requiresPhone: BrandConfigKeys.CHECKOUT_REQUIRE_PHONE;
    requiresCompany: BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS;
    requiresAddress: BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS;
  };
  // ---
  autoupdate?: boolean;
  dirty?: boolean;
  error?: ResponseError;
}
