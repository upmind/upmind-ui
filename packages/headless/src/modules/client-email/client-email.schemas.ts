/** @internal */
import { SortDirection } from "../query/query.types";
import { PAGINATION } from "../query/query.utils";
import { DEFAULT_SORT } from "./client-email.types";
import type { QuerySchema } from "./client-email.types";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-email/client-email.schemas
 * @description The module's schema family: the per-email FORM pair
 * (`useSchema`/`useUischema`), the collection's QUERY schema pair
 * (`useQuerySchema`/`useQueryUischema`) and the per-action INPUT schemas
 * (`useActionInputSchemas`). Every schema is a self-contained JSON literal, so
 * any of them lifts straight into ajv or a test.
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
 * The collection's whole REQUEST STATE as Draft-07 JSON Schema — `filters`
 * (WIRE column → declared operator → value), `sort` and `pagination`. No
 * `query` property: this endpoint ignores a search term, so the search box
 * binds `filters.email.like`.
 *
 * `additionalProperties: false` at both filter levels makes an undeclared
 * column or operator unspellable rather than merely invalid; a field absent
 * from `sort`'s `field` enum is unsortable for the same reason (an unknown
 * `order=` column is an HTTP 500). Optional leaves are typed
 * `["<type>", "null"]` because `useModelParser` coerces a plain `boolean` leaf
 * to `false`, putting a filter nobody set on the wire. Every `title` holds an
 * i18n key, never English.
 *
 * A function, not a constant: a module whose filterable columns are only known
 * once the server answers merges them in at call time.
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
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        // `minimum: 0`, not 1: `limit: 0` stays legal for a module that wants
        // one unpaged page.
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
 * query schema.
 *
 * Every element is a `Filter` (client-vue's dispatching renderer) scoping the
 * COLUMN, never an operator leaf: the renderer reads the column's own declared
 * operators and picks the control. `options.treatment` names which tri-state
 * control a boolean column draws (client-vue's `FilterTreatment`, spelt as a
 * literal because headless cannot import from client-vue); `options.states`
 * names a toggle group's two positions by the position's own value.
 *
 * Every element carries an `i18n` key — the only channel that can set a
 * control's label and placeholder, so it must resolve to an OBJECT rather than
 * a flat `text.*` key. The `sort` and `pagination` branches carry no element: a
 * branch no element draws is still validated and still translated.
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
            options: { treatment: "button-group" }
          },
          {
            type: "Filter",
            scope: "#/properties/filters/properties/bounced",
            i18n: "form.bounced_filter",
            options: {
              treatment: "toggle-group",
              states: {
                true: "text.bounced_label",
                false: "text.not_bounced_label"
              }
            }
          }
        ]
      }
    ]
  } as UISchemaElement;
}
