import type { ResponseError } from "../../utils";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { BrandConfigKeys } from "@upmind-automation/types";
import type { IBasket } from "@upmind-automation/types";

export { UnifiedType } from "./unified/types";
// --- internal

// -----------------------------------------------------------------------------

/**
 * Interface representing the data model for billing information, typically used in checkout forms.
 * This model holds the identifiers for the selected address, company, and phone.
 */
export interface BillingModel {
  /**
   * The unique identifier of the selected address for billing, or `null` if no address is selected.
   */
  addressId?: IBasket["address_id"] | null;
  /**
   * The unique identifier of the selected company for billing, or `null` if no company is selected.
   */
  companyId?: IBasket["company_id"] | null;
  /**
   * The unique identifier of the selected phone number for billing, or `null` if no phone is selected.
   */
  phoneId?: IBasket["phone_id"] | null;
}

/**
 * Interface representing the context for billing management, typically managed by an XState machine.
 * It holds the state for billing forms, including the data model, schema definitions,
 * and configuration settings derived from brand keys.
 */
export interface BillingContext {
  /**
   * The unique identifier of the current shopping basket.
   */
  basketId?: string;
  /**
   * The unique identifier of the client for whom billing information is being managed.
   */
  clientId?: string;
  // ---
  /**
   * The JSON Schema (`JsonSchema`) used to define the structure and validation rules for the billing form.
   */
  schema?: JsonSchema;
  /**
   * The UI Schema (`UISchemaElement`) used to configure the presentation and layout of the billing form.
   */
  uischema?: UISchemaElement;
  /**
   * The current {@link BillingModel} being managed or displayed in the billing form.
   */
  model?: BillingModel;
  /**
   * The base {@link BillingModel} representing the initial or last saved state of the billing information.
   */
  baseModel?: BillingModel;
  // ---
  /**
   * Configuration settings for billing, derived from {@link BrandConfigKeys}, indicating
   * which fields are required.
   */
  config?: {
    /**
     * The brand configuration key indicating whether a phone number is required during checkout.
     */
    requiresPhone: BrandConfigKeys.CHECKOUT_REQUIRE_PHONE;
    /**
     * The brand configuration key indicating whether company information is required for orders.
     */
    requiresCompany: BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS;
    /**
     * The brand configuration key indicating whether an address is required for orders.
     */
    requiresAddress: BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS;
  };
  // ---
  /**
   * `true` if the billing context should automatically update based on changes.
   */
  autoupdate?: boolean;
  /**
   * An error object if any issue occurred during billing operations.
   */
  error?: ResponseError;
}
