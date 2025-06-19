// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { QueryResponseError } from "../../query";
import { BrandConfigKeys, IBasket } from "@upmind-automation/types";

export { UnifiedAddressType } from "./unifiedAddress/types";
// --- internal

// -----------------------------------------------------------------------------

export interface BillingModel {
  addressId?: IBasket["address_id"];
  companyId?: IBasket["company_id"];
  phoneId?: IBasket["phone_id"];
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
  error?: QueryResponseError;
}
