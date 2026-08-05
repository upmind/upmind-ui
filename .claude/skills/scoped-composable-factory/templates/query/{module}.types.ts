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
 * list (its scope matrix and public model types are re-exported through
 * `index.ts`). `client-email/client-email.types.ts` carries no marker either
 * — consistent with the doctrine here, unlike `account/account.types.ts`
 * (see `templates/machine/{module}.types.ts`'s own note on that disagreement).
 *
 * `@precedent` citations point at `client-email/` — the only query-backed scoped
 * module, and the FE-2824 implementation this bundle's anti-cosplay law was
 * written about. Cite it for facts; never copy its shape.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ListQuery, QueryParams } from "../query";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module module/module.types
 * @description Replace this line with the module's job to be done — the
 * factory intake's first answer (`docs/sdd/<ID>/requirements.md`). Never ship
 * this placeholder description.
 *
 * @doctrine `code-composables.md` Part B "File Structure" — `{module}.types.ts`
 * is required for every scoped composable.
 * @precedent `client-email/client-email.types.ts` — armless: one scope
 * matrix, no `.{actor}.ts` type split anywhere in the module.
 */

/**
 * Context types for `module`'s collection — who the collection belongs to.
 * @doctrine clause 3 (per-actor arm ONLY for exclusive/overriding members) —
 * fix only the contexts this module's ADR-001 parity table actually needs.
 */
export enum ModuleContextTypes {
  /** Acting on a client's collection — rename/replace per this module's ADR-001 parity cells. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Module scope matrix (runtime value — single source of truth).
 * @doctrine clause 2 (fresh modules start armless) — declaring every actor
 * here does NOT create an arm; arms are earned independently, per clause 3.
 * @precedent `client-email/client-email.types.ts`
 * `CLIENT_EMAILS_SCOPE_MATRIX`.
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
 * One item in the module's collection — replace with the real view-model.
 * No machine-context type exists in the query variant — the query itself IS
 * the state (`code-composables.md` Part B "State Machine vs TanStack Query").
 */
export type ModuleItem = {
  id: string;
  /**
   * Present because `use{Module}.context.{actor}.ts`'s own client-exclusive
   * `entitlements` computed reads it. Replace with the module's real
   * per-item fields at intake.
   */
  entitlements?: string[];
};

/**
 * Placeholder wire shape for the list endpoint's raw response item — replace
 * with the module's real request/response type.
 * @doctrine `code-typescript.companion.md` "Types-module suffix" — types live
 * in `*.types.ts`, never inline in a services/mappers file.
 * @precedent `client-email/client-email.types.ts`'s `IEmail` import (the
 * wire type comes from `@upmind-automation/types` there; this skeleton has no
 * such generated type to cite, so `ModuleWireItem` stands in for it).
 */
export type ModuleWireItem = {
  id: string;
};

/**
 * The CLIENT surface's shape for the same record. This actor's arm reads
 * collection from `clients/{id}/module-items`, which returns everything
 * the shared read does PLUS its own extra fields — so it needs its own
 * wire type and its own mapper (`mapClientModuleItems`, `module.mappers.ts`).
 * Replace the illustrative extras with this module's real client-only fields.
 */
export type ClientModuleWireItem = ModuleWireItem & {
  internal_notes?: string;
  flagged_by?: string;
};

/**
 * The view-model half of the pair. `mapClientModuleItems` maps
 * `ClientModuleWireItem` to this; the arm's `loadList` names both as its
 * `list<Wire[], View[]>` generics. A wire type without its view-model half does
 * not build — add them together.
 */
export type ClientModuleItem = ModuleItem & {
  internalNotes?: string;
  flaggedBy?: string;
};

// --- Add the module's form/request/response model types below this line.
export type ModuleModel = Record<string, unknown>;

/**
 * The common type `scopedServices()` in `module.services.ts` resolves to. A
 * member the shared factory always supplies is required; a member only an arm
 * supplies is optional — an armless module resolves to none of the latter. An
 * arm types its own export as `Partial<ModuleServices>` against this.
 *
 * Hand-declared rather than derived, for the same reason `auth.types.ts` declares
 * `AuthServices`: the switch's branches each return a different arm, and they
 * need one type to unify on. The other three layers derive theirs with
 * `ReturnType` because they have no such switch.
 *
 * Member names match the machine variant's own `ModuleServices` so both variants'
 * arm templates illustrate the identical conceptual pair.
 * @worked-example (cross-variant) `auth/auth.types.ts:209-242`'s `AuthServices` —
 * no query-backed module has earned a services arm, so this contract's SHAPE is
 * borrowed from the machine variant, not from a live query-variant precedent.
 */
export type ModuleServices = {
  /**
   * The stable base query key the module's list caches under — the shared
   * factory always supplies it (`invalidate`/`refresh` in the actions layer
   * key off it). Declared here so the factory's annotated return literal
   * passes TS excess-property checking.
   */
  queryKey: (string | Record<string, unknown>)[];
  /**
   * OVERRIDING MEMBER contract — the clearest per-actor divergence this layer
   * has: the SAME list and the SAME endpoint, but each actor asks for what it
   * needs. The shared read stays lean; an arm adds the related fields its own
   * surface uses, which changes the response shape and therefore the mapper.
   * @doctrine clause 3 — "overriding the shared implementation".
   */
  loadList: (
    params?: Partial<QueryParams<ModuleWireItem[], ModuleItem[]>>
  ) => ListQuery<ModuleWireItem[], ModuleItem[]>;
  /**
   * Shared domain mutation — required, because the shared factory always
   * supplies it and both the shared `login` action and the actions arm's
   * override call it (`useModule.actions.ts` / `.{actor}.ts`).
   */
  login: (model: Record<string, unknown>) => Promise<unknown>;
  /**
   * ARM-SUPPLIED MEMBER contract — every arm that earns this layer implements
   * it with divergent business logic, and the shared factory declares no
   * default at all: optional here because only an arm ever supplies it.
   * @doctrine clause 3 — measured against the shared factory, which declares
   * no `register`.
   * @worked-example (cross-variant) `AuthServices.register` (required, not
   * optional — `auth/auth.types.ts:218-221`); every arm's own body diverges
   * (`auth/auth.services.client.ts:152-187`,
   * `auth/auth.services.staff.ts:130-144`,
   * `auth/auth.services.guest.ts:72-81` throws Forbidden).
   */
  register?: (model: Record<string, unknown>) => Promise<unknown>;
  /**
   * EXCLUSIVE MEMBER contract — optional because absent from arms that don't
   * earn it.
   * @doctrine clause 3 — "members exclusive to it".
   * @worked-example (cross-variant) `AuthServices.registerAsGuest?`,
   * `auth/auth.types.ts:236-243`.
   */
  registerAsGuest?: () => Promise<unknown>;
};

/**
 * The common type `scopedSchemas()` in `module.schemas.ts` resolves to — same
 * role as `ModuleServices` above, for the schemas layer. The three parsers are
 * required because the shared factory always supplies them; an arm overriding
 * one types its own export as `Partial<ModuleSchemas>`.
 */
export type ModuleSchemas = {
  useSchema: () => JsonSchema7;
  useUischema: () => UISchemaElement;
  useModuleModelParser: (model?: ModuleModel) => ModuleModel;
};

/**
 * The reactive list query. Minted ONCE per scope in `useModule.ts` and passed
 * into every layer factory and arm — never re-minted per sub-composable, or
 * each one gets its own query key, refs and effect scope.
 *
 * Aliased from the query platform's own `ListQuery` — NEVER derived with
 * `ReturnType<typeof localServiceFn>`; `ListQuery`'s docblock states that ban
 * verbatim (`modules/query/query.types.ts`). Platform seams law:
 * `code-composables.companion.md` "Platform seams every composable consumes".
 */
export type ModuleListQuery = ListQuery<ModuleWireItem[], ModuleItem[]>;
