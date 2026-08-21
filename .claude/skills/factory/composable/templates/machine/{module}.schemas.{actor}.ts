/** @internal */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Actor-Specific
 * Sub-Composables" + `code-composables.companion.md` "Variance law" clauses
 * 2/3/4/5 + `code-ui.companion.md` (Uischema/JSONForms — every element MUST
 * carry an `i18n` property). A disagreement between this skeleton, its worked
 * example, and the doctrine is a surfaced finding, never silently resolved
 * toward either.
 *
 * USE THIS FILE ONLY WHEN CLAUSE 3 TRIGGERS: at least one schema (or one
 * field/required-rule within a schema) is exclusive to the `client` actor, or
 * overrides `module.schemas.ts`'s shared implementation — never as an empty
 * scaffold (clause 2). Otherwise DELETE this file; the armless shared parsers
 * in `module.schemas.ts` suffice. See `.claude/skills/factory/composable/templates/ARMS.md` for the full decision tree.
 *
 * Illustrates the `client` arm. Rename `client`/`Client` (and this filename's
 * `{actor}` token) to `staff`/`Staff` or `guest`/`Guest` if this module's
 * ADR-001 parity table names a different actor — copy this file once per
 * actor that earns one.
 *
 * NO REFERENCE IMPLEMENTATION EXISTS for this layer — every `.schemas*.ts`
 * split in this codebase today is by FORM FLOW (`auth.schemas.login.ts` /
 * `.recover.ts` / `.register.ts` / `.twofa.ts`), never by actor. This file's
 * shape is derived from the DOCTRINE PROSE (`code-composables.md` Part B
 * "same pattern for every layer"), applying the same exclusive+override
 * pattern the actions/context/meta arms exhibit.
 *
 * MACHINE <-> QUERY SYMMETRY — this file's two worked members
 * (`useClientModuleRegisterSchemaParser` exclusive,
 * `useModuleSchemaParser` overriding) are the SAME conceptual pair as the
 * sibling variant's own.
 */

import { useSchemaDefinitions, useUischemaDefinitions } from "./module.schemas";
import type { ModuleModel, ModuleSchemas } from "./module.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module module/module.schemas.client
 * @description Client-specific schema parsers — populated ONLY when this
 * module has earned a schemas arm (clause 3). Shared parsers stay in
 * `module.schemas.ts`.
 */

/**
 * EXCLUSIVE MEMBER worked example — a schema only this actor has; absent from
 * the shared parsers entirely (nothing to justify with a decision-record
 * comment — there is no shared key to duplicate).
 *
 * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
 * Sub-Composables") — "members exclusive to it".
 * @doctrine (no per-actor runtime file exists for this layer — see this
 * file's own top note). Structural sibling, same client-exclusive concept:
 * `module.services.{actor}.ts` / `useModule.actions.{actor}.ts`'s own
 * `registerAsGuest`.
 */
export const useClientModuleRegisterSchemaParser = (): JsonSchema => {
  const definitions = useSchemaDefinitions();

  return {
    type: "object",
    title: "Module — client onboarding",
    // A DIFFERENT form from `useSchema` above, not a variant of it: the client
    // onboarding flow this actor alone runs. Reuses the shared definitions for
    // the fields it has in common, so it cannot drift from them either.
    definitions,
    properties: {
      email: { $ref: "#/definitions/email" },
      acceptedTerms: { type: "boolean" },
      referralCode: { type: "string" }
      // ... the rest of THIS form's fields. `...` is a TOKEN — replace it;
      // never ship it. Pair it with its own uischema parser.
    },
    required: ["email", "acceptedTerms"]
  };
};

/**
 * OVERRIDING MEMBER worked example — same key (`useModuleSchemaParser`) as
 * `module.schemas.ts`'s shared parser; this arm's version is resolved LAST
 * (per that file's own MERGE SEAM comment) and wins. Shape is A vs A+B:
 * shared returns A (the base field set + base required rules); this arm
 * returns A + B (the same base fields PLUS client-only fields, and a
 * TIGHTER required list).
 *
 * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
 * Sub-Composables") — "overriding the shared implementation".
 * @decision
 * what: this arm's schema parser returns the shared base properties AND adds
 *   the client-only fields, and marks more of them required than the shared
 *   parser does.
 * why: a staff actor filling this form on a client's behalf is not held to
 *   the same required-field set (staff can save a partial record and chase
 *   the client for the rest); encoding both rule sets in the shared parser
 *   would force it to branch on actor (clause 4 violation).
 * rejected: branching the shared parser internally on actor — rejected per
 *   clause 4 (no runtime actor branch inside a shared factory) and per
 *   Part B "NO .base Files".
 */
export const useModuleSchemaParser = (): JsonSchema => {
  const definitions = useSchemaDefinitions();

  return {
    type: "object",
    title: "Module",
    // Same definitions block as the shared parser — imported, not copied, so
    // a change to a shared field definition propagates here automatically.
    definitions,
    properties: {
      // ---- OVERRIDDEN: the headline per-actor difference ----
      // Shared `$ref`s `#/definitions/id`, which is `readOnly` with a default:
      // the field is a valid model value, but that actor may not SET it.
      // This arm inlines a writable variant instead — this client supplies
      // their own reference at creation time, so it is settable AND required
      // (see the `required` list below). Inlining a full object rather than
      // `$ref`-ing is the signal that this field diverges.
      id: { type: "string", minLength: 6 },

      // ---- OVERRIDDEN: shared's definition says `minLength: 1`; this arm
      //      needs 3. An arm may only TIGHTEN a shared rule, never loosen it.
      name: { type: "string", minLength: 3 },

      // ---- INHERITED: `$ref` to the shared definition. No divergence, so no
      //      duplication — and no drift if the shared definition changes.
      email: { $ref: "#/definitions/email" },

      // ---- ADDITIONAL, client-only: absent from the shared parser ----
      phone: { type: "string" }
      // ... plus every OTHER field this arm adds or overrides. `...` is a
      // TOKEN — replace it; never ship it. Each one needs a matching control
      // in this file's uischema override below.
    },
    // Shared requires ["name"] and cannot set `id` at all.
    // This arm requires "id" (now settable) and "phone" as well.
    required: ["id", "name", "phone"]
  };
};

/**
 * OVERRIDING MEMBER — the uischema counterpart of this file's schema
 * override. **Schema and uischema move together**: this arm's schema
 * un-readOnly'd `id` and added `phone`, so this layout MUST render controls
 * for both, or the form ships required fields the user cannot fill.
 *
 * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
 * Sub-Composables") — "overriding the shared implementation".
 * @doctrine `code-ui.companion.md` — every element MUST carry `i18n`
 * (mandatory, non-negotiable in this repo).
 * @decision
 * what: this arm's `useModuleUischemaParser` renders the shared controls PLUS
 *   controls for the fields its own schema override introduced (`id`, `phone`),
 *   and re-declares `name` with different options.
 * why: the schema override alone would produce an unfillable form — a
 *   required field with no control. The two parsers are one contract.
 * rejected: leaving uischema shared and letting the base layout render the
 *   arm's fields — rejected because the base layout has no control for them,
 *   and adding them there would render dead controls for every other actor.
 */
export const useModuleUischemaParser = (): UISchemaElement => {
  const controls = useUischemaDefinitions();

  return {
    type: "VerticalLayout",
    elements: [
      // ---- ADDITIONAL CONTROL: this arm's schema override made `id`
      //      writable and required, so it MUST render a control the shared
      //      layout omits (the shared set has no `id` entry — it is `readOnly`
      //      there). Schema and uischema move together.
      {
        type: "Control",
        scope: "#/properties/id",
        i18n: "form.module_client_reference"
      },

      // ---- OVERRIDDEN: full inline control, because this arm renders `name`
      //      differently — same scope, `focus` option added so the client's
      //      form lands on it. Inlining rather than spreading `controls.name`
      //      is the signal that this control diverges.
      {
        type: "Control",
        scope: "#/properties/name",
        i18n: "form.module_name",
        options: { focus: true }
      },

      // ---- INHERITED: spread the shared control. No divergence, so no
      //      duplication — and no drift if the shared control changes.
      controls.email,

      // ---- ADDITIONAL, client-only: `phone` is absent from the shared schema
      //      and therefore from the shared control set.
      {
        type: "Control",
        scope: "#/properties/phone",
        i18n: "form.module_phone"
      }
      // ... plus a control for every OTHER field this arm adds or overrides.
      // `...` is a TOKEN — replace it; never ship it.
    ]
  } as UISchemaElement;
};

export const useClientModuleModelParser = (
  model?: ModuleModel
): ModuleModel => {
  // Spread the model, then apply whatever else THIS actor needs on top.
  return { ...model };
};

// -----------------------------------------------------------------------------
// Factory Export

/**
 * Creates client-specific module parsers. Shared parsers stay in
 * `module.schemas.ts`, which spreads this over them — same shape as
 * `module.services.{actor}.ts`'s own `createClientModuleServices`.
 */
export function createClientModuleSchemas(): Partial<ModuleSchemas> {
  return {
    useModuleSchemaParser,
    useModuleUischemaParser
  };
}

export type ClientModuleSchemas = ReturnType<typeof createClientModuleSchemas>;
