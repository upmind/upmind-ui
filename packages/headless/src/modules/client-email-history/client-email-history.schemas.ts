/** @internal */
import { SENT_EMAIL_DEFAULT_SORT } from "./client-email-history.types";
import type { SentEmailQuerySchema } from "./client-email-history.types";
import type { JsonSchema7 } from "@jsonforms/core";
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
            title: "text.subject",
            additionalProperties: false,
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          sent: {
            type: "object",
            title: "text.sent",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                oneOf: [
                  { const: true, title: "text.yes" },
                  { const: false, title: "text.no" }
                ]
              }
            }
          },
          bounced: {
            type: "object",
            title: "text.bounced",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                oneOf: [
                  { const: true, title: "text.yes" },
                  { const: false, title: "text.no" }
                ]
              }
            }
          },
          error_id: {
            type: "object",
            title: "text.failed",
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
            field: { enum: ["created_at", "subject"] },
            dir: { enum: ["asc", "desc"] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: 0 },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}
