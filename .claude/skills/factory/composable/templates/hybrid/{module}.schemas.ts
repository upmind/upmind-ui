/** @internal *
 * `@precedent` citations point at `client-email/` — the only query-backed scoped
 * module, and the FE-2824 implementation this bundle's anti-cosplay law was
 * written about. Cite it for facts; never copy its shape.
 */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-ui.companion.md` (Uischema/JSONForms — every
 * element MUST carry an `i18n` property; mandatory and non-negotiable). A
 * disagreement between this skeleton, its worked example, and the doctrine is
 * a surfaced finding, never silently resolved toward either.
 */

import { ScopeActorTypes } from "../scope";
import { PAGINATION, SortDirection } from "../query";
// import { createClientModuleSchemas } from "./module.schemas.client";
import type { ModuleModel, ModuleSchemas } from "./module.types";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module module/module.schemas
 * @description The module's schema family: the FORM pair
 * (`useSchema`/`useUischema`) plus its model parser, for the edit form if this
 * module has one, and the collection's QUERY schema pair
 * (`useQuerySchema`/`useQueryUischema`) — the whole of its request state.
 * @precedent `client-email/client-email.schemas.ts` (single-file,
 * armless).
 */

/**
 * Shared field definitions — the single source of truth for any field an ARM
 * may also need. An arm `$ref`s these rather than re-declaring them, so a
 * change here propagates to every arm instead of drifting.
 *
 * @doctrine `code-ui.companion.md` (Uischema/JSONForms).
 * @worked-example `client-address/client-address.schemas.ts`'s own
 * `useSchemaDefinitions()` (exported, returns `JsonSchema7["definitions"]`,
 * consumed via `definitions:` + `$ref: "#/definitions/<name>"`) — the live
 * precedent in this codebase; `client-company` and `payment-details` consume
 * it the same way.
 */
export function useSchemaDefinitions(): JsonSchema7["definitions"] {
  return {
    // `id` is a real, valid model value — every actor's form knows the field.
    // What differs per actor is whether that actor may SET it, which is why
    // the shared parser `$ref`s this definition as-is and an arm inlines its
    // own writable variant instead (see `module.schemas.{actor}.ts`).
    id: { type: "string", readOnly: true, default: "" },
    name: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" }
    // ... the rest of this module's REUSABLE field definitions. `...` is a
    // TOKEN — replace it; never ship it.
  };
}

export const useSchema = (): JsonSchema7 => {
  const definitions = useSchemaDefinitions();

  return {
    type: "object",
    title: "Module",
    // Every reusable field lives in `definitions` and is referenced by
    // `$ref`. An arm overriding this parser `$ref`s the SAME definition for
    // any field it does not change, and inlines a FULL object only for the
    // fields it genuinely differs on — so the diff between shared and arm
    // reads as: `$ref` = inherited, inline object = overridden.
    definitions,
    properties: {
      // INHERITED: `$ref` to the shared definition — `readOnly`, so the shared
      // form renders no control for it and this actor cannot set it.
      id: { $ref: "#/definitions/id" },
      name: { $ref: "#/definitions/name" },
      email: { $ref: "#/definitions/email" }
      // ... the rest of this module's shared fields. `...` is a TOKEN —
      // replace it; never ship it. Every property added here needs a matching
      // control in the uischema parser below.
    },
    required: ["name"]
  };
};

/**
 * Shared control definitions — the uischema counterpart of
 * `useSchemaDefinitions()`. JSONForms has no `$ref` for uischema, so reuse is
 * by named element: an arm REFERENCES the shared control for any field it
 * renders identically, and writes a full inline control only for the fields it
 * renders differently. Same read as the schema layer:
 * referenced = inherited, inline control = overridden.
 *
 * One entry per reusable control, keyed by the field it renders, so an arm can
 * take exactly the ones it needs.
 *
 * @doctrine `code-ui.companion.md` — every element MUST carry `i18n`
 * (mandatory, non-negotiable in this repo).
 * @decision
 * what: this returns a KEYED MAP of controls, which no live module does.
 * why: the per-field key is what lets an arm take one control and re-author
 *   another; the repo's live element factories return a single element
 *   (`client-address/client-address.schemas.ts:133-141`, inserted whole at
 *   `:240`; `client-company/client-company.schemas.ts:131`) or an array spread
 *   into `elements` (`auth/auth.schemas.register.ts:180`,
 *   `client-personal-details/client-personal-details.schemas.ts:84`) — neither
 *   is addressable per field, so neither supports the arm story this layer
 *   exists for.
 * rejected: copying the single-element / array-spread shape — rejected because
 *   an arm could then only take ALL the shared controls or none. Nothing in
 *   this tree precedents the keyed map: it is derived from doctrine, and the
 *   first real module to earn a schemas arm is the receipt to cite here.
 */
export function useUischemaDefinitions() {
  return {
    name: {
      type: "Control",
      scope: "#/properties/name",
      i18n: "form.module_name"
    },
    email: {
      type: "Control",
      scope: "#/properties/email",
      i18n: "form.module_email"
    }
    // ... one entry per REUSABLE control. `...` is a TOKEN — replace it; never
    // ship it. `id` has no entry: it is `readOnly` in the shared schema, so no
    // actor renders it from the shared set.
  };
}

export const useUischema = (): UISchemaElement => {
  const controls = useUischemaDefinitions();

  return {
    type: "VerticalLayout",
    // Controls come from the shared definitions above — referenced, not
    // copied, so an arm reusing one cannot drift from it.
    elements: [
      controls.name,
      controls.email
      // ... the rest of this module's shared controls, one per shared schema
      // property. `...` is a TOKEN — replace it; never ship it.
    ]
  } as UISchemaElement;
};

export const useModuleModelParser = (model?: ModuleModel): ModuleModel => {
  return { ...model };
};

// -----------------------------------------------------------------------------
// Query schema — the collection's request state

/**
 * The collection's QUERY schema — its whole request state (filters · sort ·
 * pagination) as ONE Draft-07 schema over one model, and the SINGLE SOURCE OF
 * TRUTH for both surfaces that read it: the filter bar renders off
 * `useQueryUischema()` below, and the sort control derives its options from
 * this schema's own `sort.items.field` enum and their labels from the column
 * titles here. Neither is ever re-declared elsewhere — a second list of filters
 * or of sort options is a parallel contract that drifts from the one the
 * request is actually built with.
 *
 * A SELF-CONTAINED JSON literal, so it lifts straight into ajv or a test.
 * `additionalProperties: false` at every level is what makes an undeclared
 * column or operator unspellable.
 *
 * WHERE IT IS CONSUMED — both, or the collection can neither filter nor sort:
 * `module.services.ts`'s `list({ criteria: { schema: useQuerySchema() } })`,
 * which is what the request is built from, and the context layer's
 * `schemas: { query: { schema, uischema } }` pair, which is what a consumer
 * renders.
 *
 * `verified` below is a WORKED EXAMPLE of a boolean column — rename it to this
 * module's own, or delete it; every column here must exist on the mapped
 * record. A field the API cannot filter on has no entry.
 *
 * @doctrine `code-ui.companion.md` (Uischema/JSONForms) — a column's `title` is
 * an i18n key, and it is the only label channel the sort control has.
 * @precedent `client-email/client-email.schemas.ts`'s `useQuerySchema` (filters
 * + sort + pagination); `client-address/client-address.schemas.ts`'s is the
 * unsorted, unpaged minimum — a module declares only what its API serves.
 * @decision
 * what: authored `satisfies JsonSchema7`, NOT `as const satisfies JsonSchema7`.
 * why: the translator and ajv walk this schema at RUNTIME, where
 *   `additionalProperties: false` does the enforcing; no consumer reads its
 *   literal types.
 * rejected: `as const satisfies JsonSchema7` — `@jsonforms/core` types
 *   `oneOf`/`enum`/`items`/`required` as MUTABLE arrays, so `as const`'s
 *   readonly arrays fail the `satisfies` check outright.
 */
export function useQuerySchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "object",
            title: "text.module_name",
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
          }
          // ... one entry per FILTERABLE column, keyed by the column and
          // carrying only the operators the API serves. `...` is a TOKEN —
          // replace it; never ship it.
        }
      },
      sort: {
        type: "array",
        // The BOOT order only: a user sort replaces the whole model, and an
        // emptied sort refills itself from this default on the next parse.
        default: [{ field: "created_at", dir: SortDirection.DESC }],
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            // This enum is the WHOLE vocabulary of sortable columns — the sort
            // control offers exactly these and nothing else.
            field: { enum: ["created_at", "name"] },
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
 * query schema above.
 *
 * Every element is a `Filter` (client-vue's dispatching renderer) scoping the
 * COLUMN, never an operator leaf: the renderer reads the column's own declared
 * operators and picks the control. `options.treatment` names which tri-state
 * control a boolean column draws (client-vue's `FilterTreatment`, spelt as a
 * literal because headless cannot import from client-vue); `options.states`
 * names a toggle group's two positions by the position's own value.
 *
 * Every element carries an `i18n` key — the only channel that sets a control's
 * label AND its placeholder, so it must resolve to an OBJECT, never a flat
 * `text.*` key. The `sort` and `pagination` branches carry no element: a branch
 * no element draws is still validated and still translated.
 *
 * The bar is ONE row: `flow` opts the layout into the toolbar treatment, where
 * each control keeps its natural width and the leftover width goes to the one
 * element declaring `width: "full"`.
 *
 * @doctrine `code-ui.companion.md` (Uischema/JSONForms) — every element MUST
 * carry an `i18n` property; mandatory and non-negotiable.
 * @precedent `client-email/client-email.schemas.ts`'s `useQueryUischema`.
 */
export function useQueryUischema(): UISchemaElement {
  return {
    type: "HorizontalLayout",
    options: { flow: true },
    elements: [
      {
        type: "Filter",
        scope: "#/properties/filters/properties/name",
        i18n: "form.module_search",
        options: { width: "full" }
      },
      {
        type: "Filter",
        scope: "#/properties/filters/properties/verified",
        i18n: "form.verified_filter",
        options: { treatment: "button-group" }
      }
      // ... one element per filterable column the bar offers. A column the
      // schema declares and no element draws is filterable by URL and absent
      // from the bar — a deliberate choice, not an oversight. `...` is a
      // TOKEN — replace it; never ship it.
    ]
  } as UISchemaElement;
}

// -----------------------------------------------------------------------------
// Schemas Factory

/**
 * Schema matrix: maps scopeActor types to their parser implementations.
 * Actor-specific parsers are created via factories, shared parsers are spread in
 * below. The shape is the same armed or armless — an armless module has only the
 * `default:` case, so nothing here or downstream changes when an arm is earned.
 *
 * Resolve the schema and uischema parsers TOGETHER — they are ONE contract. An
 * arm that overrides the schema (adding a field, or un-`readOnly`-ing one)
 * without overriding the uischema ships a required field with no control.
 */
function scopedSchemas(scopeActor: ScopeActorTypes): Partial<ModuleSchemas> {
  switch (scopeActor) {
    // case ScopeActorTypes.CLIENT:
    //   return createClientModuleSchemas();
    default:
      // Empty because this module is armless: no actor has earned an arm yet, so
      // there is nothing to merge over the shared parsers. Only arm-specific
      // members ever appear here — the shared ones are spread in below.
      return {};
  }
}

/**
 * Parsers factory — same shape as `module.services.ts`'s own
 * `createModuleServices`: the concrete actor arrives first, at construction, and
 * the form that owns this module's edit surface calls it once.
 */
export const createModuleSchemas = (
  scopeActor: ScopeActorTypes
): ModuleSchemas => ({
  useSchema,
  useUischema,
  useModuleModelParser,
  ...scopedSchemas(scopeActor)
});

export default createModuleSchemas;
