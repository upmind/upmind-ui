/** @internal */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-ui.companion.md` (Uischema/JSONForms — every
 * element MUST carry an `i18n` property; mandatory and non-negotiable). A
 * disagreement between this skeleton, its worked example, and the doctrine is
 * a surfaced finding, never silently resolved toward either.
 */

import { ScopeActorTypes } from "../scope";
// import { createClientModuleSchemas } from "./module.schemas.client";
import type { ModuleContext, ModuleModel, ModuleSchemas } from "./module.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module module/module.schemas
 * @description Schema / uischema / model parsers owned by the module. Split
 * into `module.schemas.{flow}.ts` (Part A "File Naming") once this file hosts
 * more than one form flow — see `auth.schemas.login.ts` / `.recover.ts` /
 * `.register.ts` / `.twofa.ts` for the earned split.
 * @worked-example `account/account.schemas.ts` (single-file, armless);
 * `client-email/client-email.schemas.ts` is the query-variant equivalent.
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
export function useSchemaDefinitions(): JsonSchema["definitions"] {
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

export const useModuleSchemaParser = (): JsonSchema => {
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

export const useModuleUischemaParser = (): UISchemaElement => {
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
 * Parsers object ready for direct use in the machine — same shape as
 * `module.services.ts`'s `moduleServices`: each member resolves the arm from
 * `context.scopeActor` per call, because a machine has no construction-time seam
 * to close over. The arm is tried first and the shared parser is the fallback,
 * which is what makes an arm's parser an override.
 */
export const moduleSchemas = {
  useModuleModelParser,

  useModuleSchemaParser: ({ scopeActor }: ModuleContext): JsonSchema =>
    scopedSchemas(scopeActor as ScopeActorTypes).useModuleSchemaParser?.() ??
    useModuleSchemaParser(),

  useModuleUischemaParser: ({ scopeActor }: ModuleContext): UISchemaElement =>
    scopedSchemas(scopeActor as ScopeActorTypes).useModuleUischemaParser?.() ??
    useModuleUischemaParser()
};

export default moduleSchemas;
