/** @internal */
import { DEFAULT_SORT } from "./client-email.types";
import type { QuerySchema } from "./client-email.types";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-email/client-email.schemas
 * @description The module's schema family. TWO concerns live here, both
 * `@internal` and both reaching consumers only through a sub-composable return:
 *
 * 1. The per-email FORM (`useSchema`/`useUischema`) — a schema/uischema PAIR the
 *    manager's machine adopts (`setSchemas`) and surfaces on
 *    `useClientEmailManager().useContext().schema` / `.uischema`.
 * 2. The collection's QUERY schema (`useQuerySchema`/`useQueryUischema`) — the
 *    whole request state (filters · sort · pagination) as ONE Draft-07 schema
 *    over one model (S-D9), surfaced on `useClientEmails().useContext().query`
 *    (the model) and `.schemas.query` (the schema pair), plus the per-action
 *    INPUT schemas (`useActionInputSchemas`) the coverage gate reads.
 *
 * Every schema is a SELF-CONTAINED JSON literal — no helper builds one, so any
 * of them can be lifted straight into ajv or a test and run standalone.
 *
 * WARNING: Do not import directly from another module. The barrel exports no
 * schema — a form rendered from a schema the machine has not adopted validates
 * against a different contract than the one that saves.
 */

export const useSchema = (): JsonSchema7 => {
  return {
    type: "object",
    title: "Email",
    required: ["email"],
    definitions: {
      id: {
        type: ["string", "null"],
        title: "ID",
        readOnly: true
      },
      email: {
        type: "string",
        format: "email",
        title: "Email"
      }
    },
    properties: {
      id: { $ref: "#/definitions/id" },
      email: { $ref: "#/definitions/email" }
    }
  };
};

export const useUischema = (): UISchemaElement => {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/id",
        // Force-hidden: without the rule the auto-generated id renders in the
        // email field's place.
        rule: {
          effect: "HIDE",
          condition: { const: true }
        }
      },
      {
        type: "Control",
        scope: "#/properties/email",
        i18n: "form.email",
        options: {
          autoFocus: true,
          autocomplete: "email"
        }
      }
    ]
  } as UISchemaElement;
};

// -----------------------------------------------------------------------------
// Per-action INPUT schemas (Task 33) — the coverage-gate map
// -----------------------------------------------------------------------------

/**
 * Per-action INPUT schemas for the collection — the map `runGate` enumerates to
 * decide which actions are "input-taking" (ADR-027 Am.6): an action with an
 * entry takes input; one absent from the map does not, and absence is the whole
 * meaning of "not input-taking". Every entry is a real object JSON Schema so the
 * harness's `isRealJsonSchema` guard accepts it — which is why an id-only action
 * declares an object rather than a bare `{type:"string"}`. Reached only through
 * `useClientEmails().useInternals().actionSchemas`; `runGate` is its sole
 * consumer.
 *
 * `ensure` takes an `EmailModel`, so its input schema IS the per-email form
 * schema. `remove`/`setDefault`/`verify` take an id.
 */
export function useActionInputSchemas(): Record<string, JsonSchema7> {
  return {
    ensure: useSchema(),
    remove: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: { id: { type: "string", title: "ID" } }
    },
    setDefault: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: { id: { type: "string", title: "ID" } }
    },
    verify: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: { id: { type: "string", title: "ID" } }
    }
  };
}

// -----------------------------------------------------------------------------
// QUERY schema — the whole request state as ONE Draft-07 schema (S-D9)
// -----------------------------------------------------------------------------

/**
 * The rules for this collection's whole REQUEST STATE, as Draft-07 JSON Schema:
 * `filters` (nested column → operator → value), `sort` and `pagination` — the
 * three members `QueryProps` already accepts — over one model. No `query`
 * property: `GET /clients/{id}/emails` ignores a search term (A-D5 finding 9),
 * so declaring one would reproduce the exact live defect Task 39 fixes; the
 * search box binds `filters.email.like`.
 *
 * Inside `filters`, `properties` are WIRE column names and each column's own
 * `properties` are the operators it allows, so `additionalProperties: false` at
 * both levels makes a disallowed operator unspellable rather than merely
 * invalid, and the ajv error names the column. A field absent from `sort`'s
 * `field` enum is unsortable for the same reason — an unknown `order=` column is
 * an HTTP 500.
 *
 * The tri-state filter leaves are typed `["boolean", "null"]`: unset is a third
 * state, and `useModelParser` coerces a plain `boolean` leaf to `false` — which
 * would put `filter[verified|eq]=0` on the wire for a filter nobody set.
 *
 * A FUNCTION, not a constant, and deliberately so: a module whose filterable
 * columns are only known once the server answers (custom fields — S-D13) merges
 * them in here at call time. Client-emails has none.
 *
 * @decision as-const-vs-satisfies
 * what: authored `satisfies JsonSchema7`, NOT `as const satisfies JsonSchema7`
 *   (the §1.5a idiom).
 * why: nothing consumes the schema's literal types — `FilterModel`/`SortModel`
 *   are hand-authored in `client-email.types.ts`, and the translator + ajv walk
 *   the schema at RUNTIME, where `additionalProperties: false` enforces
 *   principle 5 (an undeclared column/operator is unspellable).
 * rejected: `as const satisfies JsonSchema7` — `@jsonforms/core`@3.7.0 types
 *   `oneOf`/`enum`/`items`/`required` as MUTABLE arrays, so `as const`'s
 *   readonly arrays fail the `satisfies` check (a compile error), and the
 *   compile-time literal benefit §1.5a sought has no consumer here.
 */
export function useQuerySchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    title: "Client email query",
    description: "How the email list is filtered, sorted and paged.",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        title: "Client email filters",
        additionalProperties: false,
        properties: {
          email: {
            type: "object",
            title: "Email address",
            description: "Show emails containing this text.",
            additionalProperties: false,
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: "string", minLength: 1, title: "contains" }
            }
          },
          verified: {
            type: "object",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                oneOf: [
                  { const: true, title: "client_email.filter.verified_yes" },
                  { const: false, title: "client_email.filter.verified_no" }
                ]
              }
            }
          },
          bounced: {
            type: "object",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                oneOf: [
                  { const: true, title: "client_email.filter.bounced_yes" },
                  { const: false, title: "client_email.filter.bounced_no" }
                ]
              }
            }
          },
          default: {
            type: "object",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                oneOf: [
                  { const: true, title: "client_email.filter.default_yes" },
                  { const: false, title: "client_email.filter.default_no" }
                ]
              }
            }
          }
        }
      },
      sort: {
        type: "array",
        title: "Client email sort",
        description: "The order the list is in. The first entry wins.",
        default: DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["created_at", "email", "default"] },
            dir: { enum: ["asc", "desc"] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        // `minimum: 0`, NOT 1: `limit: 0` is this module's own default
        // (`client-email.services.ts`) and a value `useQuery` preserves.
        properties: {
          limit: { type: "integer", minimum: 0 },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

/**
 * The module's DEFAULT filter-bar presentation — ONE uischema over the one query
 * schema, so a search box and three filter controls are a single JSONForms form.
 * Each `scope` names an exact `(branch, column, operator)` predicate, so the
 * scope IS the operator selection. The `sort` and `pagination` branches carry
 * no element: a branch no element draws is still validated and still translated.
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "HorizontalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/email/properties/like",
        i18n: "client_email.filter.email"
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/verified/properties/eq",
        i18n: "client_email.filter.verified",
        options: { format: "tristate" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/bounced/properties/eq",
        i18n: "client_email.filter.bounced",
        options: { format: "tristate" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/default/properties/eq",
        i18n: "client_email.filter.default",
        options: { format: "tristate" }
      }
    ]
  } as UISchemaElement;
}
