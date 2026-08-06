/** @internal */
import { useValidation } from "../../utils";
import {
  isArray,
  isEmpty,
  isPlainObject,
  omitBy,
  reduce,
  reject,
  uniqBy
} from "lodash-es";
import type {
  FilterModel,
  QueryModel,
  QuerySchema,
  SortEntry,
  SortModel
} from "./client-email.types";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { ComputedRef, Ref } from "vue";
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
 * WARNING: Do not import directly from another module. The barrel exports no
 * schema — a form rendered from a schema the machine has not adopted validates
 * against a different contract than the one that saves.
 */

/** Reusable field definitions the schema `$ref`s. */
export function useSchemaDefinitions(): JsonSchema7["definitions"] {
  return {
    id: {
      type: ["string", "null"],
      title: "ID",
      description: "The auto-generated ID of this email.",
      readOnly: true
    },
    email: {
      type: "string",
      format: "email",
      title: "Email"
    }
  };
}

export const useSchema = (): JsonSchema7 => {
  return {
    type: "object",
    title: "Email",
    required: ["email"],
    definitions: useSchemaDefinitions(),
    properties: {
      id: { $ref: "#/definitions/id" },
      email: { $ref: "#/definitions/email" }
    }
  };
};

/** Reusable control definitions — the uischema counterpart of the above. */
export function useUischemaDefinitions() {
  return {
    id: {
      type: "Control",
      scope: "#/properties/id",
      // Force-hidden: without the rule the auto-generated id renders in the
      // email field's place.
      rule: {
        effect: "HIDE",
        condition: { const: true }
      }
    },
    email: {
      type: "Control",
      scope: "#/properties/email",
      i18n: "form.email",
      options: {
        autoFocus: true,
        autocomplete: "email",
        placeholder: "name@email.com"
      }
    }
  };
}

export const useUischema = (): UISchemaElement => {
  const controls = useUischemaDefinitions();

  return {
    type: "VerticalLayout",
    elements: [controls.id, controls.email]
  } as UISchemaElement;
};

// -----------------------------------------------------------------------------
// Per-action INPUT schemas (Task 33) — the coverage-gate map
// -----------------------------------------------------------------------------

/**
 * The input JSON Schema for an action whose only argument is an email id
 * (`remove`, `setDefault`, `verify`). An object schema rather than a bare
 * `{type:"string"}` because the harness's `isRealJsonSchema` guard accepts a
 * schema only when it is object-typed or carries `properties`.
 */
const idInputSchema: JsonSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: { id: { type: "string", title: "ID" } }
};

/**
 * Per-action INPUT schemas for the collection — the map `runGate` enumerates to
 * decide which actions are "input-taking" (ADR-027 Am.6): an action with an
 * entry takes input; one absent from the map does not, and absence is the whole
 * meaning of "not input-taking". Every entry is a real object JSON Schema so the
 * harness's `isRealJsonSchema` guard accepts it. Reached only through
 * `useClientEmails().useInternals().actionSchemas`; `runGate` is its sole
 * consumer.
 *
 * `ensure` takes an `EmailModel`, so its input schema IS the per-email form
 * schema. `remove`/`setDefault`/`verify` take an id.
 */
export function useActionInputSchemas(): Record<string, JsonSchema7> {
  return {
    ensure: useSchema(),
    remove: idInputSchema,
    setDefault: idInputSchema,
    verify: idInputSchema
  };
}

// -----------------------------------------------------------------------------
// QUERY schema — the whole request state as ONE Draft-07 schema (S-D9)
// -----------------------------------------------------------------------------

/** The default sort — a fixed leading order the user may change (S-D16). */
export const DEFAULT_SORT: SortModel = [{ field: "created_at", dir: "desc" }];

/**
 * Emits a tri-state boolean filter branch inline — source-level reuse without a
 * `$ref` (the translator would need a second, partial JSON-Schema resolver to
 * follow one). Repetition in the JSON, none in the source (S-D1).
 */
function boolFilter(yesKey: string, noKey: string): JsonSchema7 {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      eq: {
        type: "boolean",
        oneOf: [
          { const: true, title: yesKey },
          { const: false, title: noKey }
        ]
      }
    }
  };
}

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
 * invalid, and the ajv error names the column.
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
    description:
      "The whole request state for GET /clients/{clientId}/emails: the filter predicates, the sort order and the page window. One schema, one model, one uischema.",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        title: "Client email filters",
        description:
          "Every filterable column on GET /clients/{clientId}/emails. A column absent from this branch cannot be filtered; an operator absent from a column cannot be spelled.",
        additionalProperties: false,
        properties: {
          email: {
            type: "object",
            title: "Email address",
            description:
              "Substring match on the raw `email` column. The translator supplies the % wildcards.",
            additionalProperties: false,
            properties: {
              like: { type: "string", minLength: 1, title: "contains" }
            }
          },
          verified: boolFilter(
            "client_email.filter.verified_yes",
            "client_email.filter.verified_no"
          ),
          bounced: boolFilter(
            "client_email.filter.bounced_yes",
            "client_email.filter.bounced_no"
          ),
          default: boolFilter(
            "client_email.filter.default_yes",
            "client_email.filter.default_no"
          )
        }
      },
      sort: {
        type: "array",
        title: "Client email sort",
        description:
          "Ordered, additive: list position is precedence. A field absent from the enum cannot be sorted on — an unknown `order=` column is an HTTP 500.",
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
        i18n: "client_email.filter.email",
        options: { placeholder: "name@email.com" }
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

/**
 * Drops every filter leaf that is `undefined`, `null` or `""`, then any operator
 * bag left empty, then an empty `filters` bag. Runs BEFORE validation: a cleared
 * JSONForms control writes `null`, so validating first turns clearing a filter
 * into an error. Schema-free and module-agnostic; returns a fresh object.
 */
export function pruneQuery(model: QueryModel): QueryModel {
  const pruned: QueryModel = { ...model };

  if (isPlainObject(pruned.filters)) {
    const filters = reduce(
      pruned.filters,
      (acc: Record<string, Record<string, unknown>>, ops, column) => {
        const kept = omitBy(
          ops as Record<string, unknown>,
          value => value === undefined || value === null || value === ""
        );
        if (!isEmpty(kept)) acc[column] = kept;
        return acc;
      },
      {}
    );

    if (isEmpty(filters)) delete pruned.filters;
    else pruned.filters = filters as FilterModel;
  }

  return pruned;
}

/**
 * Validates `candidate` against `schema` and returns it, or retains `current`
 * when it fails. Never throws and never lets an invalid model reach the wire —
 * an unknown filter column is an HTTP 500. Uses the repo's own ajv
 * (`useValidation`), so its formats, keywords and `useDefaults` const/`default`
 * injection all apply.
 */
export function acceptOrRetain<T>(
  schema: JsonSchema7,
  candidate: T,
  current: Ref<T> | ComputedRef<T>
): T {
  const { validate } = useValidation();
  return validate(schema, candidate).length === 0 ? candidate : current.value;
}

/**
 * Reads a `const`-forced leading sort declared as a Draft-07 TUPLE head
 * (`items: [ … ]`). The family's forced-primary-sort mechanism; client-emails
 * declares its `sort.items` as an object, so this is a no-op here.
 */
function forcedSortHead(schema: QuerySchema): SortEntry | undefined {
  const items = schema.properties?.sort?.items;
  const head = isArray(items) ? items[0] : undefined;
  const field = head?.properties?.field?.const;
  const dir = head?.properties?.dir?.const;

  return typeof field === "string"
    ? { field, dir: dir === "asc" ? "asc" : "desc" }
    : undefined;
}

/**
 * Re-asserts the schema's floor on the query intent's `sort` branch:
 * substitutes `DEFAULT_SORT` for an empty array (`minItems: 1`), dedupes by
 * `field` (`uniqueItems` compares whole objects, so one field in two directions
 * would otherwise pass), and preserves any `const`-forced leading entry.
 * TanStack's non-multi click path replaces the whole array, so without this a
 * forced head is destroyed by one header click. Takes and returns the whole
 * model — one pipeline, one object.
 */
export function assertSortFloor(
  schema: QuerySchema,
  intent: QueryModel
): QueryModel {
  const deduped = uniqBy(intent.sort ?? [], entry => entry.field);
  const forced = forcedSortHead(schema);
  const withHead = forced
    ? [forced, ...reject(deduped, entry => entry.field === forced.field)]
    : deduped;

  return { ...intent, sort: withHead.length > 0 ? withHead : DEFAULT_SORT };
}
