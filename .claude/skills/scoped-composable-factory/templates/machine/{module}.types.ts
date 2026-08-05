// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` (base, Part A/B — cite, never
 * restate) + this repo's `code-composables.companion.md` "Variance law"
 * (clauses 1-5). A disagreement between this skeleton, its worked example,
 * and the doctrine is a surfaced finding for the operator — never silently
 * resolved toward either (the precedence correction both companions carry).
 *
 * NOTE ON THE MISSING `@internal` MARKER: `code-quality.md`'s Module
 * Visibility Law lists exactly `*.machine.ts` / `*.services.ts` /
 * `*.mappers.ts` / `*.schemas.ts` as internal — `*.types.ts` is not on that
 * list, because a module's scope matrix and public model types are re-
 * exported through `index.ts`. `account/account.types.ts` carries an
 * `@internal` marker anyway; that is a doctrine-vs-example disagreement,
 * surfaced (not silently copied) rather than resolved toward the example —
 * see `docs/sdd/FE-2966-FE-2967/evidence/decisions.md`, Task 7.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ScopeContext } from "../scope/scope.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/module.types
 * @description Replace this line with the module's job to be done — the
 * factory intake's first answer (`docs/sdd/<ID>/requirements.md`). Never ship
 * this placeholder description.
 *
 * @doctrine `code-composables.md` Part B "File Structure" — `{module}.types.ts`
 * is required for every scoped composable.
 * @worked-example `account/account.types.ts` — armless: one scope matrix, no
 * `.{actor}.ts` type split anywhere in the module.
 */

/**
 * Context types for `module` — who an actor can act on behalf of.
 * @doctrine clause 3 (per-actor arm ONLY for exclusive/overriding members) —
 * this enum fixes the LEGITIMATE contexts; it does not itself create an arm.
 * An enum with a member this module's parity table doesn't actually need is a
 * clause-3 smell before a single `.{actor}.ts` file is even written.
 */
export enum ModuleContextTypes {
  /** Acting on behalf of a client — rename/replace per this module's ADR-001 parity cells. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Module scope matrix (runtime value — single source of truth).
 * @doctrine clause 2 (fresh modules start armless) — declaring every actor
 * here does NOT create an arm; arms are earned independently, per clause 3.
 * @worked-example `account/account.types.ts` `ACCOUNT_SCOPE_MATRIX`.
 */
export const MODULE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: ModuleContextTypes.CLIENT,
  [ScopeActorTypes.CLIENT]: ModuleContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Module scope matrix type (derived from the runtime const above). */
export type ModuleScopeMatrix = typeof MODULE_SCOPE_MATRIX;

/**
 * Machine context. `scopeActor` is typed as an already-resolved actor.
 * @doctrine clause 4 (`.as('self')` resolution is owned by the scope
 * builder) — nothing that reads this type should import or branch on
 * `ScopeActorTypes.SELF`; the only resolution site in this codebase is
 * `resolveSelfActor` in `scope/scope.utils.ts`, called once from
 * `scope/scope.builder.ts`.
 */
export type ModuleContext = {
  scopeActor?: ScopeActorTypes;
  /** Who the actor is acting on behalf of, if anyone. */
  scopeContext?: ScopeContext<`${ModuleContextTypes}`>;
  /** Brand filter for multi-brand environments. */
  brandId?: string;
  // --- add module-specific machine-context fields below this line
  /**
   * The fields below exist because this template's shipped machine, services
   * and context factory already reference them — `{module}.machine.ts`'s
   * `setModel` action, `{module}.services.ts`'s `parse`/`validate`, and
   * `use{Module}.context.ts`'s `useContext(state, "model")`. Swap
   * `ModuleModel` for the concrete model type at intake.
   * @worked-example `account/account.types.ts:74-76`.
   */
  model?: ModuleModel;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  /** Base reference data, extended per-actor by a context arm if one is earned. */
  lookups?: Record<string, unknown>[];
  error?: unknown;
};

// --- Add the module's form/request/response model types below this line.
// Naming/shape doctrine for these is `code-typescript.md` + its companion
// ("Types-module suffix") — cite, don't restate here.
export type ModuleModel = Record<string, unknown>;

/**
 * The common type `scopedServices()` in `module.services.ts` resolves to. Every
 * member is optional because an armless module resolves to none of them; an arm
 * types its own export as `Partial<ModuleServices>` against this.
 *
 * Hand-declared rather than derived, for the same reason `auth.types.ts` declares
 * `AuthServices`: the switch's branches each return a different arm, and they
 * need one type to unify on. The other three layers derive theirs with
 * `ReturnType` because they have no such switch.
 * @worked-example `auth/auth.types.ts:209-242`'s `AuthServices` — the same role.
 * It marks `register` required because auth is never armless; a template that
 * ships armless cannot.
 */
export type ModuleServices = {
  /**
   * OVERRIDING MEMBER contract — every arm that earns this layer implements it
   * with divergent business logic, never a shared default.
   * @doctrine clause 3 — "overriding the shared implementation".
   * @worked-example `AuthServices.register` (required, not optional —
   * `auth/auth.types.ts:218-221`); every arm's own body diverges
   * (`auth/auth.services.client.ts:152-187`,
   * `auth/auth.services.staff.ts:130-144`,
   * `auth/auth.services.guest.ts:72-81` throws Forbidden).
   */
  register?: (
    context: ModuleContext,
    event: AnyEventObject
  ) => Promise<unknown>;
  /**
   * EXCLUSIVE MEMBER contract — optional because absent from arms that don't
   * earn it.
   * @doctrine clause 3 — "members exclusive to it".
   * @worked-example `AuthServices.registerAsGuest?`,
   * `auth/auth.types.ts:236-243`.
   */
  registerAsGuest?: (
    context: ModuleContext,
    event: AnyEventObject
  ) => Promise<unknown>;
};

/**
 * The common type `scopedSchemas()` in `module.schemas.ts` resolves to — same
 * role as `ModuleServices` above, for the schemas layer. The three parsers are
 * required because the shared factory always supplies them; an arm overriding
 * one types its own export as `Partial<ModuleSchemas>`.
 */
export type ModuleSchemas = {
  useModuleSchemaParser: () => JsonSchema;
  useModuleUischemaParser: () => UISchemaElement;
  useModuleModelParser: (model?: ModuleModel) => ModuleModel;
};
