/** @internal */
import { PAGINATION } from "../query/query.utils";
import { SENT_EMAIL_DEFAULT_SORT } from "./client-email-history.types";
import type { SentEmailQuerySchema } from "./client-email-history.types";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/client-email-history.schemas
 * @description The collection's QUERY schema — its whole request state
 * (filters · sort · pagination) as ONE Draft-07 schema over one model. A
 * SELF-CONTAINED JSON literal, so it can be lifted straight into ajv or a test
 * and run standalone.
 *
 * WARNING: Do not import directly from another module — the barrel exports no
 * schema.
 */
// -----------------------------------------------------------------------------

/**
 * `sent` / `bounced` are the tab filters the history surface offers, and
 * `error_id` carries the failed tab: a send that errored has one, so
 * `neq: "null"` is "show me the failures". The search box binds
 * `subject.like` — this endpoint honours no free-text term of its own.
 */
export function useQuerySchema(): SentEmailQuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          subject: {
            type: "object",
            title: "Subject",
            additionalProperties: false,
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          sent: {
            type: "object",
            title: "Sent",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                oneOf: [
                  { const: true, title: "Yes" },
                  { const: false, title: "No" }
                ]
              }
            }
          },
          bounced: {
            type: "object",
            title: "Bounced",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                oneOf: [
                  { const: true, title: "Yes" },
                  { const: false, title: "No" }
                ]
              }
            }
          },
          error_id: {
            type: "object",
            title: "Failed",
            additionalProperties: false,
            properties: {
              neq: { type: ["string", "null"], minLength: 1 }
            }
          }
        }
      },
      sort: {
        type: "array",
        default: SENT_EMAIL_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: {
              // `oneOf` const/title (not a bare enum) so the sort control draws
              // a human label per option — matches the client-email sibling.
              oneOf: [
                { const: "created_at", title: "Date added" },
                { const: "subject", title: "Subject" }
              ]
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
 * The module's DEFAULT filter-bar presentation — ONE uischema over the one
 * query schema. Every element is a `Filter` scoping the COLUMN, never an
 * operator leaf: the renderer reads the column's declared operators and picks
 * the control. The `sort` and `pagination` branches carry no element — a branch
 * no element draws is still validated and translated. `error_id` (the "failed"
 * column) is declared and settable through `setCriteria`, but not drawn here:
 * it is a string `neq`, not a boolean the tri-state controls render.
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Filter",
        scope: "#/properties/filters/properties/subject",
        i18n: "form.subject_search",
        options: { width: "full" }
      },
      {
        type: "Filter",
        scope: "#/properties/filters/properties/sent",
        i18n: "form.sent_filter",
        options: { treatment: "button-group" }
      },
      {
        type: "Filter",
        scope: "#/properties/filters/properties/bounced",
        i18n: "form.bounced_filter",
        options: {
          treatment: "toggle-group",
          states: {
            true: "text.bounced",
            false: "text.not_bounced_label"
          }
        }
      }
    ]
  } as UISchemaElement;
}
