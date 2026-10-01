/** @internal */
import {
  CreditNoteStatus,
  InvoiceCategoryCode,
  InvoiceStatus
} from "@upmind-automation/types";
import { SortDirection } from "../query/query.types";
import { PAGINATION } from "../query/query.utils";
import { INVOICE_DEFAULT_SORT, InvoicesContextTypes } from "./invoices.types";
import { values } from "lodash-es";
import type { InvoicesScopeLookups } from "./invoices.types";
import type { QuerySchema } from "../query/query.types";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module invoices/invoices.schemas
 * @description The invoices list's query schema and its filter-bar and sort
 * uischemas, the two query schemas the relationship lookups read, and the
 * scope picker's lookups pair.
 */
// -----------------------------------------------------------------------------

export function useQuerySchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      // A column with no operator branch reaches the wire as `filter[column]`.
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: ["string", "null"] },
          number: { type: ["string", "null"] },
          "status.code": {
            type: ["string", "array", "null"],
            items: {
              type: "string",
              enum: [...values(InvoiceStatus), ...values(CreditNoteStatus)]
            },
            uniqueItems: true
          },
          client_id: { type: ["string", "null"] },
          is_consolidation: {
            type: ["boolean", "null"],
            enum: [true, false, null]
          },
          "category.slug": {
            type: ["string", "array", "null"],
            items: { type: "string", enum: values(InvoiceCategoryCode) },
            uniqueItems: true
          },
          paid_amount: { type: ["number", "null"] },
          total_amount: { type: ["number", "null"] },
          net_amount: { type: ["number", "null"] },
          total_discount_amount: { type: ["number", "null"] },
          create_datetime: {
            type: "object",
            additionalProperties: false,
            properties: {
              eq: { type: ["string", "null"], format: "date-time" },
              gte: { type: ["string", "null"], format: "date-time" },
              lte: { type: ["string", "null"], format: "date-time" }
            }
          },
          due_date: {
            type: "object",
            additionalProperties: false,
            properties: {
              eq: { type: ["string", "null"], format: "date-time" },
              gte: { type: ["string", "null"], format: "date-time" },
              lte: { type: ["string", "null"], format: "date-time" }
            }
          },
          proforma: { type: ["boolean", "null"], enum: [true, false, null] },
          fraud_status: {
            type: ["number", "array", "null"],
            items: { type: "number" },
            uniqueItems: true
          }
        }
      },
      sort: {
        type: "array",
        default: INVOICE_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: {
              enum: [
                "create_datetime",
                "number",
                "total_amount",
                "net_amount",
                "status",
                "paid_datetime",
                "due_date",
                "cancellation_datetime"
              ]
            },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies QuerySchema;
}

export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/number",
        i18n: "form.invoice_number_filter",
        options: { format: "search", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/status.code",
        i18n: "form.invoice_status_filter",
        options: { format: "multi-select", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/category.slug",
        i18n: "form.invoice_category_filter",
        options: { format: "multi-select", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/is_consolidation",
        i18n: "form.invoice_consolidation_filter",
        options: { format: "toggle-group", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/total_amount",
        i18n: "form.invoice_total_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/net_amount",
        i18n: "form.invoice_net_filter",
        options: { optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/create_datetime",
        i18n: "form.invoice_created_filter",
        options: { format: "range", optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/due_date",
        i18n: "form.invoice_due_filter",
        options: { format: "range", optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.invoice_sort"
  };
}

// -----------------------------------------------------------------------------
// The three lists the scope picker reads. A lookup schema declares only what
// its search writes: the list schema's other filter columns would reach the
// wire empty and evict the static request params beside `client_id`.
// -----------------------------------------------------------------------------

export function useInvoiceLookupQuerySchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          number: {
            type: "object",
            additionalProperties: false,
            properties: { like: { type: ["string", "null"], minLength: 1 } }
          }
        }
      },
      sort: {
        type: "array",
        maxItems: 1,
        uniqueItems: true,
        default: INVOICE_DEFAULT_SORT,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["create_datetime", "number"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies QuerySchema;
}

export function useContractsQuerySchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          main_invoice_number: {
            type: "object",
            additionalProperties: false,
            properties: { like: { type: ["string", "null"], minLength: 1 } }
          }
        }
      },
      sort: {
        type: "array",
        maxItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["create_datetime", "main_invoice_number"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies QuerySchema;
}

export function useContractProductsQuerySchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          service_identifier: {
            type: "object",
            additionalProperties: false,
            properties: { like: { type: ["string", "null"], minLength: 1 } }
          }
        }
      },
      sort: {
        type: "array",
        maxItems: 1,
        uniqueItems: true,
        default: [{ field: "service_identifier", dir: SortDirection.ASC }],
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["service_identifier", "create_datetime"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies QuerySchema;
}

// -----------------------------------------------------------------------------
// The scope picker: one nullable id per `.for()` context, relationships first.
// -----------------------------------------------------------------------------

export function useLookupsSchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      [InvoicesContextTypes.CONTRACT]: { type: ["string", "null"] },
      [InvoicesContextTypes.CONTRACT_PRODUCT]: { type: ["string", "null"] },
      [InvoicesContextTypes.INVOICE]: { type: ["string", "null"] },
      [InvoicesContextTypes.CLIENT]: { type: ["string", "null"] }
    }
  } satisfies QuerySchema;
}

/** Each relationship control binds its lookup thunk here, once. */
export function useLookupsUischema(
  lookups: InvoicesScopeLookups
): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Lookup",
        scope: `#/properties/${InvoicesContextTypes.CONTRACT}`,
        i18n: "form.contract_lookup",
        options: {
          lookup: {
            service: lookups.contract,
            searchScope: "filters.main_invoice_number.like"
          },
          optionalText: ""
        }
      },
      {
        type: "Lookup",
        scope: `#/properties/${InvoicesContextTypes.CONTRACT_PRODUCT}`,
        i18n: "form.contract_product_lookup",
        options: {
          lookup: {
            service: lookups.contracts_product,
            searchScope: "filters.service_identifier.like"
          },
          optionalText: ""
        }
      },
      {
        type: "Lookup",
        scope: `#/properties/${InvoicesContextTypes.INVOICE}`,
        i18n: "form.invoice_lookup",
        options: {
          lookup: {
            service: lookups.invoice,
            searchScope: "filters.number.like"
          },
          optionalText: ""
        }
      },
      {
        type: "Control",
        scope: `#/properties/${InvoicesContextTypes.CLIENT}`,
        i18n: "form.client_id",
        options: {
          optionalText: ""
        }
      }
    ]
  } as UISchemaElement;
}

// -----------------------------------------------------------------------------
// The invoice picker: one searchable lookup over this client's own invoices.
// -----------------------------------------------------------------------------

/** A surface's invoice-finder — one searchable lookup over the client's own
 *  invoices, keyed by the id the single-invoice read loads by. Distinct from
 *  the `.for()` context form above: this finds ONE invoice, it does not
 *  retarget the list, and its control is the invoice finder alone — no client,
 *  contract or contract-product control. */
export function useInvoicePickerSchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      invoice: { type: ["string", "null"] }
    }
  } satisfies QuerySchema;
}

export function useInvoicePickerUischema(
  lookups: InvoicesScopeLookups
): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Lookup",
        scope: "#/properties/invoice",
        i18n: "form.invoice_picker",
        options: {
          lookup: {
            service: lookups.invoicePicker,
            searchScope: "filters.number.like"
          },
          optionalText: ""
        }
      }
    ]
  } as UISchemaElement;
}
