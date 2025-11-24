// --- internal

// --- types
import type { ICustomField } from "@upmind-automation/types";

// --- external

// --- internal

// -----------------------------------------------------------------------------

export interface CustomFieldModel {
  // firstName?: string;
  // lastName?: string;
  // customFields?: Record<string, any>;
}

/**
 * Interface representing a comprehensive client custom field object, extending {@link CustomFieldModel}
 * with additional identifiers, computed display fields, and meta-data about its status.
 * This is typically used for custom field retrieved from the API or displayed in the UI.
 */
export interface CustomField {
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
  type: ICustomField["type"];
  /**
   * A object type of the custom field.
   */
  objectType: ICustomField["object_type"];
  /**
   * A flag indicating whether the custom field is hidden.
   */
  hidden: boolean;
  /**
   * A client readonly flag of the custom field.
   */
  meta: {
    isDisabled: ICustomField["client_readonly"];
  };
}
