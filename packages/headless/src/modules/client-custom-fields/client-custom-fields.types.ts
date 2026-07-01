import type { ICustomField } from "@upmind-automation/types";

// --- external

// --- internal

// -----------------------------------------------------------------------------

export type CustomFieldModel = {
  // firstName?: string;
  // lastName?: string;
  // customFields?: Record<string, any>;
};

/**
 * type representing a comprehensive client custom field object, extending {@link CustomFieldModel}
 * with additional identifiers, computed display fields, and meta-data about its status.
 * This is typically used for custom field retrieved from the API or displayed in the UI.
 */
export type CustomField = {
  /**
   * The unique identifier for the custom field.
   */
  id: ICustomField["id"];
  /**
   * A code for the custom field.
   */
  code: ICustomField["code"];
  /**
   * A name of the custom field.
   */
  name: ICustomField["name"];
  /**
   * A type of the custom field.
   */
  type: ICustomField["type_code"];

  /**
   * The Lookup value/options for the custom field.
   */
  options?: ICustomField["values"];

  /**
   * A flag indicating whether the custom field is hidden.
   */
  /**
   * A client readonly flag of the custom field.
   */
  meta: {
    // isHidden: ICustomField["hidden"];
    isReadOnly: ICustomField["client_readonly"];
    isRequired: ICustomField["required"];
    isDisabled: ICustomField["client_readonly"];
    showOnOrderForm?: ICustomField["show_on_order_form"];
    showOnInvoice?: ICustomField["show_on_invoice"];
  };
};
