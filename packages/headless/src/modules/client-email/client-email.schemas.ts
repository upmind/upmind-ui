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
    required: ["email"],
    definitions: {
      id: {
        type: ["string", "null"],
        readOnly: true
      },
      email: {
        type: "string",
        format: "email",
        title: "form.email"
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
      properties: { id: { type: "string" } }
    },
    setDefault: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: { id: { type: "string" } }
    },
    verify: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: { id: { type: "string" } }
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
 * Every OPTIONAL leaf is typed `["<type>", "null"]`: unset is a third state, and
 * `useModelParser` coerces a plain `boolean` leaf to `false` — which would put
 * `filter[verified|eq]=0` on the wire for a filter nobody set. `minLength`
 * applies only to strings, so a cleared `like` still validates while `""` does
 * not, which is what makes "empty means unset" enforceable at the renderer seam.
 *
 * Every `title` here holds an i18n KEY, never English (design §4.1/§13.3): the
 * column titles are what JSONForms falls back to when an element's `i18n` key
 * fails to resolve, and each `oneOf` member's title is the option label the
 * `Filter` renderer translates. English in either place is a translation that
 * silently never fires. A title no element and no renderer reads is not keyed —
 * it is deleted.
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
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          email: {
            type: "object",
            title: "text.email_address",
            additionalProperties: false,
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          verified: {
            type: "object",
            title: "text.verified_label",
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
            title: "text.bounced_label",
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
          default: {
            type: "object",
            title: "text.default_label",
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
          }
        }
      },
      sort: {
        type: "array",
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
        // `minimum: 0`, NOT 1: `limit: 0` stays a legal declarable value for a
        // module that wants one unpaged page. THIS module declares 10 (matching
        // `PAGINATION.limit`) — the page size the list boots on, so the pager
        // has something to step to.
        properties: {
          limit: { type: "integer", minimum: 0, default: 10 },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

/**
 * The module's DEFAULT filter-bar presentation — ONE uischema over the one query
 * schema, so a search box and three filter controls are a single JSONForms form.
 * The search sits full width on its own row with the filters below it.
 *
 * Every element is a `Filter` (client-vue's dispatching renderer) scoping the
 * COLUMN, never an operator leaf: the renderer reads the column's own declared
 * operators and picks the control, so adding a filter is a schema line and a
 * uischema line naming the column — never a line naming its operator. Identity
 * lives in `type`, the data shape in `scope`, presentation in `options`.
 *
 * Every element carries an `i18n` key: it is the only channel that can set a
 * control's label and placeholder (the resolved value is merged into `options`,
 * so the key must resolve to an OBJECT — a flat `text.*` key cannot be used
 * here). The `sort` and `pagination` branches carry no element: a branch no
 * element draws is still validated and still translated.
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Filter",
        scope: "#/properties/filters/properties/email",
        i18n: "form.email_search",
        options: { width: "full" }
      },
      {
        type: "HorizontalLayout",
        elements: [
          {
            type: "Filter",
            scope: "#/properties/filters/properties/verified",
            i18n: "form.verified_filter",
            options: { variant: "switch" }
          },
          {
            type: "Filter",
            scope: "#/properties/filters/properties/bounced",
            i18n: "form.bounced_filter",
            options: { variant: "switch" }
          },
          {
            type: "Filter",
            scope: "#/properties/filters/properties/default",
            i18n: "form.default_filter",
            options: { variant: "switch" }
          }
        ]
      }
    ]
  } as UISchemaElement;
}
