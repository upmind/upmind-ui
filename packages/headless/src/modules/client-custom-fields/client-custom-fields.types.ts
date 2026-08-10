/**
 * @graphify-citation `graphify query "module query model filter sort pagination
 * schema"` (2026-08-10) — no `CustomFieldQueryModel` / `CustomFieldQuerySchema` node anywhere in
 * `graphify-out/graph.json`. The query platform's `QueryProps` describes the
 * WIRE shape; this describes the schema-validated MODEL, and its `sort` branch
 * consumes the platform's own `QuerySortEntry` rather than minting a parallel
 * one.
 */
import { SortDirection } from "../query/query.types";
import type { QuerySortEntry } from "../query/query.types";
import type { JsonSchema7 } from "@jsonforms/core";
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

// -----------------------------------------------------------------------------
// QUERY MODEL — the collection's whole request state as ONE model
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters` (nested column → operator →
 * value), `sort` (ordered, precedence = position) and `pagination`. This is the
 * instance validated against `useQuerySchema()`; the translator maps it to the
 * `QueryProps` the query layer accepts.
 */
export type CustomFieldQueryModel = {
  filters?: {
    name?: { like?: string };
  };
  sort?: QuerySortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/**
 * The order the list starts in — the display order the server assigns.
 * Declared as the query schema's `sort` default, so an emptied sort refills
 * itself on the next parse.
 */
export const CUSTOM_FIELD_DEFAULT_SORT: QuerySortEntry[] = [
  { field: "order", dir: SortDirection.ASC }
];

/**
 * The collection's query schema. A `JsonSchema7`: the translator and the
 * validators walk it at runtime, so the type stays general rather than a
 * module-specific literal.
 */
export type CustomFieldQuerySchema = JsonSchema7;
