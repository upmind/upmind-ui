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
// Per-action INPUT schemas — the coverage-gate map
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
// QUERY schema — the whole request state as ONE Draft-07 schema
// -----------------------------------------------------------------------------

/**
 * The collection's whole REQUEST STATE as Draft-07 JSON Schema — `filters`
 * (WIRE column → declared operator → value), `sort` and `pagination`. No
 * `query` property: this endpoint ignores a search term, so the search box
 * binds `filters.email.like`.
 *
 * `additionalProperties: false` at both filter levels makes an undeclared
 * column or operator unspellable rather than merely invalid; a field absent
 * from `sort`'s declared `field` members is unsortable for the same reason (an
 * unknown `order=` column is an HTTP 500). Optional leaves are typed
 * `["<type>", "null"]` because `useModelParser` coerces a plain `boolean` leaf
 * to `false`, putting a filter nobody set on the wire. Every `title` is plain
 * English — the uischema's `i18n` key is the override channel, never the title.
 *
 * A function, not a constant: a module whose filterable columns are only known
 * once the server answers merges them in at call time.
 *
 * @decision as-const-vs-satisfies
 * what: authored `satisfies JsonSchema7`, NOT `as const satisfies JsonSchema7`.
 * why: nothing consumes the schema's literal types — `FilterModel`/`SortModel`
 *   are hand-authored in `client-email.types.ts`, and the translator + ajv walk
 *   the schema at RUNTIME, where `additionalProperties: false` enforces
 *   principle 5 (an undeclared column/operator is unspellable).
 * rejected: `as const satisfies JsonSchema7` — `@jsonforms/core`@3.7.0 types
 *   `oneOf`/`enum`/`items`/`required` as MUTABLE arrays, so `as const`'s
 *   readonly arrays fail the `satisfies` check (a compile error), and the
 *   compile-time literal types it would buy have no consumer here.
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
            title: "Email address",
            additionalProperties: false,
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          verified: {
            type: "object",
            title: "Verified",
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
            // `oneOf` const/title, not a bare enum: the sort control's option
            // labels are the schema's own titles (`R6-28`), and a bare enum can
            // carry none — which is what left `created_at` and `default`
            // rendering as wire names. The columns are the REAL ones the API
            // orders on, the status composite never among them (`R6-6`/`R6-6b`).
            field: {
              enum: ["default", "email", "verified", "bounced", "created_at"]
            },
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
 * Every element is a plain `Control` scoping the operator LEAF, so the leaf's
 * own write IS the wire shape and JSON Forms' standard Control pipeline resolves
 * the label, the description, the errors and the enum-option labels. The control
 * a leaf draws is chosen by the tester scorecard, which `options.format` names
 * the same way the ui package's boolean treatments do (`switch` / `toggle` /
 * `card`); a leaf naming none falls to the generic renderer for its type.
 *
 * Every element carries an `i18n` key. It is also the enum-option key PREFIX,
 * so a tri-state's positions resolve as `<key>.true` / `.false` / `.null`. The
 * `sort` and `pagination` branches carry no element: a branch no element draws
 * is still validated and still translated.
 *
 * A filter is optional by definition, so every element suppresses the field's
 * optional indicator; `noLabel` marks the ones the catalogue names by their
 * placeholder or their own positions rather than a label.
 *
 * The bar is ONE row and its own element type: `FilterBar` (client-vue's
 * `FilterBarRenderer`, spelt as a literal because headless cannot import from
 * client-vue).
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/email/properties/like",
        i18n: "form.email_search",
        options: { format: "search", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/verified/properties/eq",
        i18n: "form.verified_filter",
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
