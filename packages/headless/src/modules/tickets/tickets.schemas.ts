/**
 * @graphify-citation see `tickets.types.ts`'s head citation
 * (`graphify-out/graph.json`, 2026-09-14) — no prior tickets schema construct
 * exists; new ground, not a duplicate.
 */
/** @internal */
import { PAGINATION } from "../query/query.utils";
import { TICKETS_DEFAULT_SORT } from "./tickets.types";
import { assign, omit } from "lodash-es";
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
 * (EQUAL, D19). `isClosed` is AC1/AC2's headline narrowing as ONE tri-state
 * boolean leaf — `false` active, `true` closed, `null` All — declared exactly
 * as `client-email-history.schemas.ts` declares `sent.eq`, so the ONE filter-bar
 * idiom draws it: `null` is a MEMBER of the enum, not an absence, because it is
 * the value the neutral position writes and the option whose label the control
 * resolves. `tickets.types.ts`'s `TicketsQueryModel` doc-comment carries the
 * full root-cause citation for why the leaf is spelt nothing like its wire
 * column; `tickets.services.ts`'s `applyStatusCodeFilter` re-spells it onto
 * `filter[status.code]` / `filter[status.code|neq]` at the module's own edge.
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
          isClosed: {
            type: "object",
            title: "Status",
            additionalProperties: false,
            properties: {
              // `null` is a MEMBER, not an absence: it is the value the "All"
              // position writes, so the tri-state's clear has to validate, and
              // it is the enum entry whose label the control resolves. Ordered
              // active-first so the control reads `Active │ Closed │ All` —
              // the order the collection's own vocabulary names them in.
              eq: {
                type: ["boolean", "null"],
                enum: [false, true, null]
              }
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
 * @decision
 * what:     The schema `list()` is handed — {@link useQuerySchema} MINUS the
 *           `isClosed` branch. The collection's own `applyStatusCodeFilter`
 *           spells that narrowing onto the request url itself; the query core
 *           never learns the branch exists.
 * why:      `translateQuery` emits one wire key per branch the schema declares
 *           under `filters`, spelt with the branch's OWN property name. A
 *           declared `isClosed` would therefore put `filter[isClosed|eq]=0`
 *           on the wire BESIDE the `filter[status.code…]` key the module
 *           re-spells — and `isClosed` is not a column this API has. Measured
 *           against staging 2026-09-17: the dotted key alone answers 200; the
 *           dotted key plus an undotted stray answers 500 "A critical database
 *           error occurred". The stray is not cosmetic, it is the request
 *           failing. Withholding the branch from the TRANSLATOR (and only from
 *           it) is the one place a module can stop the key being minted.
 *           Everything else still reads the FULL schema — the filter bar draws
 *           the control, the refinement chips name it, the url replay
 *           serialises it — because `useClientTickets`'s context publishes
 *           {@link useQuerySchema}, not this.
 * rejected: Teaching `translateQuery` a per-branch wire-column keyword, which
 *           is the real fix and would delete this function outright:
 *           `packages/headless/src/modules/query/**` is headless core, shared
 *           by every schema-governed collection in the tree and off limits to
 *           this story (the same R9 ruling `guardCriteriaWrite` was written
 *           under — route around at the module's own edge, never edit the
 *           core).
 * rejected: Declaring `isClosed` OUTSIDE `filters`, which the translator
 *           ignores natively. It also drops the leaf out of `declaredPairs`,
 *           so the refinement chip, Clear all and the url replay would each
 *           need a second vocabulary for one leaf.
 */
export function useWireQuerySchema(): TicketsQuerySchema {
  const schema = useQuerySchema();

  return assign({}, schema, {
    properties: assign({}, schema.properties, {
      filters: assign({}, schema.properties!.filters, {
        properties: omit(
          (schema.properties!.filters as JsonSchema7).properties,
          ["isClosed"]
        )
      })
    })
  }) as TicketsQuerySchema;
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
        // AC1/AC2 — the headline narrowing, a plain `Control` over the one
        // operator leaf, so the element's `i18n` key is also the enum-option
        // PREFIX: the three positions resolve as
        // `form.ticket_status_filter.false` / `.true` / `.null`.
        type: "Control",
        scope: "#/properties/filters/properties/isClosed/properties/eq",
        i18n: "form.ticket_status_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
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

/**
 * AC9 — the create-ticket form. `body` is required only when `files` is
 * absent (R17(b)) — mirrors the server's own conditional (measured 422:
 * "The body field is required when files is not present."), never a
 * stricter client-side rule.
 */
export function useCreateSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    required: ["subject"],
    anyOf: [{ required: ["body"] }, { required: ["files"] }],
    properties: {
      subject: { type: "string", title: "Subject", minLength: 1 },
      body: { type: "string", title: "Message", minLength: 1 },
      ticketDepartmentId: { type: ["string", "null"], title: "Department" },
      contractProductId: { type: ["string", "null"], title: "Product" },
      scheduledAt: {
        type: ["string", "null"],
        title: "Send later",
        format: "date-time"
      },
      files: { type: "array", minItems: 1 }
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
