import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { JsonSchema7 } from "@jsonforms/core";
import type { IPhone, ICountry } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Interface representing parsed phone number data, typically from a phone number parsing utility.
 */
export interface IPhoneData {
  /**
   * The national format of the phone number.
   */
  nationalNumber: string;
  /**
   * The country calling code.
   */
  countryCallingCode: string;
  /**
   * The two-letter ISO country code.
   */
  country: string;
}

/**
 * Interface representing the data model for a phone number, suitable for forms
 * or API payloads.
 */
export interface PhoneModel {
  /**
   * Optional unique identifier for the phone number. Present if editing an existing phone number.
   */
  id?: IPhone["id"];
  /**
   * An object containing the various components of the phone number.
   */
  phone: {
    /**
     * The full international phone number string, or `null`.
     */
    number: string | null;
    /**
     * The national number part of the phone number, or `null`.
     */
    nationalNumber: string | null;
    /**
     * The country calling code, or `null`.
     */
    countryCallingCode: string | null;
    /**
     * The two-letter ISO country code, or `null`.
     */
    country: string | null;
  };
  /**
   * The type of the phone number.
   * @deprecated The `type` property is deprecated in `PhoneModel` and should not be used directly here.
   */
  // type?: number; // deprecated
}

/**
 * Interface representing a comprehensive phone object, extending {@link PhoneModel}
 * with additional identifiers, computed display fields, and meta-data about its status.
 * This is typically used for phone numbers retrieved from the API or displayed in the UI.
 */
export interface Phone {
  /**
   * The unique identifier for the phone number.
   */
  id: IPhone["id"];
  /**
   * An optional display title for the phone number.
   */
  title?: string;
  /**
   * An optional detailed description of the phone number.
   */
  description?: string;
  /**
   * The {@link PhoneModel} object containing the parsed phone number details.
   */
  phone: PhoneModel["phone"];
  /**
   * The type of phone number (e.g. 1 for "Mobile", 2 for "Home").
   */
  type: IPhone["type"];
  /**
   * Meta-information about the phone number's status and capabilities.
   */
  meta: {
    /**
     * `true` if the client can delete the phone number.
     */
    canDelete: boolean;
    /**
     * `true` if the phone number has been verified.
     */
    isVerified: boolean;
    /**
     * `true` if this is the client's default phone number.
     */
    isDefault: boolean;
  };
}

/**
 * Interface representing the context for phone number management within a client item context.
 * It extends `DataManagerContext` with specific data relevant to phone operations,
 * such as geographical country context for phone number formatting and validation.
 *
 * @template TModel - The type of the phone model, typically {@link PhoneModel}.
 */
export interface PhoneContext extends DataManagerContext<PhoneModel> {
  /**
   * The currently selected {@link ICountry} object in the context, used for
   * phone number formatting and validation rules.
   */
  country?: ICountry;
}

// -----------------------------------------------------------------------------
// QUERY MODEL — the collection's whole request state as ONE model
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters` (nested column → operator →
 * value) and `pagination`. No `sort` branch: the collection is read unpaged and
 * unsorted. This is the instance validated against `useQuerySchema()`; the
 * translator maps it to the `QueryProps` the query layer accepts.
 *
 * @graphify-citation `graphify query "module query model filter sort pagination
 * schema"` (2026-08-10) — no `PhoneQueryModel` / `PhoneQuerySchema` node anywhere in
 * `graphify-out/graph.json`. The query platform's `QueryProps` describes the
 * WIRE shape; this describes the schema-validated MODEL. No duplicate to
 * consume, so minting here is warranted.
 */
export type PhoneQueryModel = {
  filters?: {
    number?: { like?: string };
  };
  pagination?: { limit?: number; offset?: number };
};

/**
 * The collection's query schema. A `JsonSchema7`: the translator and the
 * validators walk it at runtime, so the type stays general rather than a
 * module-specific literal.
 */
export type PhoneQuerySchema = JsonSchema7;
