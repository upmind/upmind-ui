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
 * BEFORE MINTING A TYPE FROM THIS SKELETON: run `/graphify query "<concept>"`
 * and paste the resulting `@graphify-citation` (naming `graphify-out/`) at the
 * head of this file, as `client-email/client-email.types.ts` does. The gate is
 * mechanical (`code-quality.companion.md` "The graphify gate") — a placeholder
 * type this skeleton names is not evidence that no live type already exists.
 *
 * `@precedent` citations point at `client-email/` — the only query-backed scoped
 * module, and the FE-2824 implementation this bundle's anti-cosplay law was
 * written about. Cite it for facts; never copy its shape.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ListQuery, QueryParams } from "../query";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { ComputedRef } from "vue";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/module.types
 * @description Replace this line with the module's job to be done — the
 * factory intake's first answer (`docs/sdd/<ID>/requirements.md`). Never ship
 * this placeholder description.
 *
 * HYBRID VARIANT — this one file carries the types for BOTH composables:
 * the query-backed COLLECTION (`useModules`) and the `dataManagerMachine`-backed
 * per-entity MANAGER (`useModuleManager`). Each owns its own context enum and
 * scope matrix (two matrices, one file); the item/model types and the
 * `ModuleServices` contract are SHARED — the manager consumes the same scoped
 * services instance the collection does, which is what keeps one identity seam
 * for both.
 *
 * @doctrine `code-composables.md` Part B "File Structure" — `{module}.types.ts`
 * is required for every scoped composable.
 * @precedent `client-email/client-email.types.ts` (collection matrix) and the
 * recovered pre-FE-2824 `client-email` tree's second matrix
 * (`CLIENT_EMAIL_SCOPE_MATRIX`, per-email manager) — armless in both halves.
 */

/**
 * Context types for `module`'s COLLECTION — who the collection belongs to.
 * @doctrine clause 3 (per-actor arm ONLY for exclusive/overriding members) —
 * fix only the contexts this module's ADR-001 parity table actually needs.
 */
export enum ModuleContextTypes {
  /** Acting on a client's collection — rename/replace per this module's ADR-001 parity cells. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Collection scope matrix (runtime value — single source of truth).
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

/** Collection scope matrix type (derived from the runtime const above). */
export type ModuleScopeMatrix = typeof MODULE_SCOPE_MATRIX;

// --- MANAGER SCOPE (hybrid half two) ----------------------------------------

/**
 * Context types for `module`'s per-entity MANAGER — a form editor over ONE
 * item. Two members, because the manager has two distinct things to address
 * and a scope carries exactly ONE `.for()` context (`scope.types.ts`
 * `ScopeConfig.context`):
 *
 * - `ITEM` — edit an existing item: `.for('module-item', itemId)`. The owning
 *   client falls through to the session's active user (the self case), exactly
 *   as the collection's own `resolveClientId` seam does.
 * - `CLIENT` — act on a NAMED client's items: `.for('client', clientId)`,
 *   typically with `.fresh()` to mint a new one. This is the retargeting cell
 *   FE-2824 dropped; it is declared here, not omitted.
 *
 * @surfaced-finding ONE context per scope means a single manager instance
 * cannot simultaneously name a target client AND an item id — i.e.
 * "staff edits client X's item Y" has no expression in the platform today. Do
 * NOT silently drop that cell if this module's ADR-001 parity table names it:
 * surface it at Plan (the honest options are a composite context id, an
 * owner-resolving `loadOne`, or a platform change) and let the operator rule.
 * The live managers (`client-phone`, `client-address`) sidestep it by taking
 * `clientId` as a plain option, which is not available to a scoped composable.
 */
export enum ModuleManagerContextTypes {
  /** Editing one existing item by id. */
  ITEM = "module-item",
  /** Acting on a named client's items (retargeting; usually with `.fresh()`). */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Manager scope matrix (runtime value). Separate from the collection's: the
 * two composables scope on different things, so they cannot share one matrix.
 *
 * The `as \`${ModuleManagerContextTypes}\`` widening is the documented way to
 * declare a cell that accepts EITHER context type — `scope.types.ts`'s own
 * `ActorContextMatrix` example uses exactly this form. It is a widening to the
 * enum's string union, never an `as any`.
 */
export const MODULE_MANAGER_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]:
    ModuleManagerContextTypes.ITEM as `${ModuleManagerContextTypes}`,
  [ScopeActorTypes.CLIENT]:
    ModuleManagerContextTypes.ITEM as `${ModuleManagerContextTypes}`,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Manager scope matrix type (derived from the runtime const above). */
export type ModuleManagerScopeMatrix = typeof MODULE_MANAGER_SCOPE_MATRIX;

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
   * The module's base cache key. Declared on the contract because
   * `createModuleServices` returns it: an object literal assigned to this type
   * cannot carry a member the type does not declare (excess-property check).
   */
  queryKey: string[];
  /**
   * SHARED MEMBER — the target client id this scope resolved, reactive.
   * Exposed on the contract so the MANAGER seeds its machine context from the
   * same seam the collection's requests use, instead of re-deriving identity
   * from the session and re-opening the FE-2824 hole one layer up.
   */
  clientId: ComputedRef<string | undefined>;
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
   * MANAGER MEMBER — per-entity read; the collection half never calls it.
   * Seeds the manager's initial model when the collection query has not been
   * minted (or has not resolved) in this consumer. Resolves its target client
   * through the SAME `resolveClientId` seam as every other member, so
   * `.for('client', id)` retargets it too.
   */
  loadOne: (id?: ModuleItem["id"]) => Promise<ModuleItem | undefined>;
  /** MANAGER MEMBER — creates an item, then invalidates the collection key. */
  add: (model: ModuleModel) => Promise<ModuleWireItem | undefined>;
  /** MANAGER MEMBER — updates an item, then invalidates the collection key. */
  update: (
    id: ModuleItem["id"],
    model: ModuleModel
  ) => Promise<ModuleWireItem | undefined>;
  /**
   * MANAGER MEMBER — find-or-create. The shared machine's `adding` state
   * invokes this instead of `add` when the module's parity table names an
   * idempotent create (`client-email`'s own `ensure` is the live precedent).
   */
  ensure: (model: ModuleModel) => Promise<ModuleItem>;
  /**
   * MANAGER MEMBER — schema validation, rejecting with a `DetailedError` whose
   * `data` carries the AJV errors. The shared machine's `setError` action lands
   * that rejection in context, where
   * `useModuleManager().useContext().validationErrors` reads it. The headless
   * layer NEVER fires feedback for it (no `useFeedback`, no toast).
   */
  validate: (model?: ModuleModel) => Promise<ModuleModel | undefined>;
  /**
   * SHARED MEMBER — invalidates this module's cache key so the collection
   * refetches. The manager calls it after a successful save rather than
   * reaching into the collection composable's query instance, which belongs to
   * a different scope key and may not exist in this consumer at all.
   */
  refresh: () => Promise<void>;
  /**
   * Shared domain mutation — required, because the shared factory always
   * supplies it and both the shared `login` action and the actions arm's
   * override call it (`useModules.actions.ts` / `.{actor}.ts`).
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
 * The reactive list query. Minted ONCE per scope in `useModules.ts` and passed
 * into every layer factory and arm — never re-minted per sub-composable, or
 * each one gets its own query key, refs and effect scope.
 *
 * Aliased from the query platform's own `ListQuery` — NEVER derived with
 * `ReturnType<typeof localServiceFn>`; `ListQuery`'s docblock states that ban
 * verbatim (`modules/query/query.types.ts`). Platform seams law:
 * `code-composables.companion.md` "Platform seams every composable consumes".
 */
export type ModuleListQuery = ListQuery<ModuleWireItem[], ModuleItem[]>;

// -----------------------------------------------------------------------------
// MANAGER (hybrid half two — the `dataManagerMachine`-backed form editor)
// -----------------------------------------------------------------------------

/**
 * The manager's machine context — the shared `dataManagerMachine`'s own
 * context, parameterised by this module's form model.
 *
 * Aliased from the platform's `DataManagerContext`, never re-declared: the
 * machine is shared and battle-hardened (`code-xstate.companion.md`), so its
 * context shape is the platform's to change, not this module's. Same platform-
 * seam law as `ModuleListQuery` above.
 * @precedent the recovered `client-email` tree's
 * `EmailContext = DataManagerContext<EmailModel>`.
 */
export type ModuleContext = DataManagerContext<ModuleModel>;

/**
 * The XState services map `useModuleManager.machine.ts` hands to
 * `dataManagerMachine.withConfig({ services })`. One key per `invoke.src` the
 * shared machine names — `loadLookups` / `parse` / `validate` / `add` /
 * `update` (`data-manager/data-manager.machine.ts`). Adding a key the machine
 * does not invoke is dead code; omitting one it does invoke is a runtime crash
 * on entering that state, not a type error, so check the machine before
 * trimming this list.
 *
 * Declared as a named contract so the adapter's return value is checked here
 * rather than only structurally at the `.withConfig()` call site — the typed
 * seam that replaces the old `useXServices() as any`.
 */
export type ModuleManagerMachineServices = {
  /** `loading` state — resolves the context patch the form starts from. */
  loadLookups: (context: ModuleContext) => Promise<Partial<ModuleContext>>;
  /** `available.checking.parsing` — schema-parses the incoming model. */
  parse: (
    context: ModuleContext,
    event: AnyEventObject
  ) => Promise<Partial<ModuleContext>>;
  /** `available.checking.validating` + `processing.validating`. */
  validate: (context: ModuleContext) => Promise<ModuleModel | undefined>;
  /** `processing.adding` — reached when the machine's `isNew` guard passes. */
  add: (context: ModuleContext) => Promise<unknown>;
  /** `processing.updating` — reached when `isNew` fails (context has an id). */
  update: (context: ModuleContext) => Promise<unknown>;
};
