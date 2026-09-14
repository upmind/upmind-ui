/**
 * @graphify-citation see `tickets.types.ts`'s head citation
 * (`graphify-out/graph.json`, 2026-09-14) — no prior tickets schema construct
 * exists; new ground, not a duplicate.
 */
/** @internal */
import { PAGINATION } from "../query/query.utils";
import { TICKETS_DEFAULT_SORT } from "./tickets.types";
import type { TicketsQuerySchema } from "./tickets.types";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module tickets/tickets.schemas
 * @description The collection's QUERY schema (filters · sort · pagination,
 * ADR-032 decision 13), plus the exported CREATE / SUBJECT / MESSAGE-EDIT
 * form schemas the consuming page validates against (R8 — the variant stays
 * `query`; this module owns no form machine).
 *
 * WARNING: do not import directly from another module.
 */
// -----------------------------------------------------------------------------

/**
 * `reference` / `subject` / `contract_product_id` are bare leaf branches
 * (EQUAL, D19). `status.code` carries both `eq` (closed tab) and `neq`
 * (active tab) so only the tab in effect reaches the wire.
 */
export function useQuerySchema(): TicketsQuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          reference: {
            type: ["string", "null"],
            title: "Reference",
            minLength: 1
          },
          subject: {
            type: ["string", "null"],
            title: "Subject",
            minLength: 1
          },
          "status.code": {
            type: "object",
            title: "Status",
            additionalProperties: false,
            properties: {
              eq: { type: ["string", "null"] },
              neq: { type: ["string", "null"] }
            }
          },
          created_at: {
            type: "object",
            title: "Date",
            additionalProperties: false,
            properties: {
              gte: { type: ["string", "null"], format: "date-time" },
              lte: { type: ["string", "null"], format: "date-time" }
            }
          },
          contract_product_id: {
            type: ["string", "null"],
            title: "Product",
            minLength: 1
          }
        }
      },
      query: { type: ["string", "null"], minLength: 3 },
      sort: {
        type: "array",
        default: TICKETS_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: {
              enum: ["reference", "subject", "created_at", "updated_at"]
            },
            dir: { enum: ["asc", "desc"] }
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
  } satisfies JsonSchema7;
}

/**
 * The collection's default filter-bar presentation. Each control scopes the
 * operator leaf directly, so the leaf's own write is the wire shape.
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "HorizontalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/query",
            i18n: "form.ticket_search",
            options: {
              format: "search",
              icon: "search-md",
              noLabel: true,
              optionalText: ""
            }
          },
          {
            type: "Control",
            scope: "#/properties/filters/properties/created_at",
            i18n: "form.created_at_range",
            options: { format: "range", noLabel: true, optionalText: "" }
          }
        ]
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/reference",
        i18n: "form.reference_search",
        options: { format: "search", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/subject",
        i18n: "form.subject_search",
        options: { format: "search", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

/** The collection's ORDERING presentation — one element over the `sort` branch. */
export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.ticket_sort"
  };
}

// -----------------------------------------------------------------------------
// FORM SCHEMAS (R8) — the module exports these; FE-1930 renders + validates.
// -----------------------------------------------------------------------------

/** AC9 — the create-ticket form. */
export function useCreateSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["subject", "body"],
    properties: {
      subject: { type: "string", title: "Subject", minLength: 1 },
      body: { type: "string", title: "Message", minLength: 1 },
      ticketDepartmentId: { type: ["string", "null"], title: "Department" },
      contractProductId: { type: ["string", "null"], title: "Product" },
      scheduledAt: {
        type: ["string", "null"],
        title: "Send later",
        format: "date-time"
      }
    }
  } satisfies JsonSchema7;
}

export function useCreateUischema(): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      { type: "Control", scope: "#/properties/subject", i18n: "form.subject" },
      {
        type: "Control",
        scope: "#/properties/ticketDepartmentId",
        i18n: "form.department"
      },
      { type: "Control", scope: "#/properties/body", i18n: "form.message" },
      {
        type: "Control",
        scope: "#/properties/contractProductId",
        i18n: "form.related_product"
      },
      {
        type: "Control",
        scope: "#/properties/scheduledAt",
        i18n: "form.send_later"
      }
    ]
  } as UISchemaElement;
}

/** AC27 — the change-subject form. */
export function useSubjectSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["subject"],
    properties: { subject: { type: "string", title: "Subject", minLength: 1 } }
  } satisfies JsonSchema7;
}

export function useSubjectUischema(): UISchemaElement {
  return {
    type: "Control",
    scope: "#/properties/subject",
    i18n: "form.subject"
  } as UISchemaElement;
}

/** AC18 — the edit-own-message form. */
export function useMessageEditSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["body"],
    properties: { body: { type: "string", title: "Message", minLength: 1 } }
  } satisfies JsonSchema7;
}

export function useMessageEditUischema(): UISchemaElement {
  return {
    type: "Control",
    scope: "#/properties/body",
    i18n: "form.message"
  } as UISchemaElement;
}
