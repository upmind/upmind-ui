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
              // `null` is a MEMBER, not an absence: it is the value the unset
              // position writes, so a tri-state's clear has to validate, and it
              // is the enum entry whose label the control resolves.
              eq: {
                type: ["boolean", "null"],
                enum: [true, false, null]
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
                enum: [true, false, null]
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
              enum: ["created_at", "subject"]
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
 * query schema. Every element is a plain `Control` scoping the operator LEAF, so
 * the leaf's own write IS the wire shape and JSON Forms resolves the label, the
 * description and the enum-option labels; `options.format` names which control
 * the tester scorecard picks. Each element's `i18n` key is also the enum-option
 * PREFIX, so a tri-state's positions resolve as `<key>.true` / `.false` /
 * `.null`. The `sort` and `pagination` branches carry no element — a branch no
 * element draws is still validated and translated. `error_id` (the "failed"
 * column) is declared and settable through `setCriteria`, but not drawn here:
 * it is a string `neq`, not a boolean the tri-state controls render.
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/subject/properties/like",
        i18n: "form.subject_search",
        options: { format: "search", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/sent/properties/eq",
        i18n: "form.sent_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/bounced/properties/eq",
        i18n: "form.bounced_filter",
        options: { format: "toggle-group", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement;
}
