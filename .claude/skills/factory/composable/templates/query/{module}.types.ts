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
// The wire type is the generated one — never hand-minted here. If
// `@upmind-automation/types` has no `I{Module}` yet, that is a types-package
// story to raise at Plan, not a placeholder to mint in this file.
import type { I{Module} } from "@upmind-automation/types";
// `SortDirection` is read at MODULE scope below (`DEFAULT_SORT`), so it comes
// in as a VALUE import, never `import type`.
import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ListQuery, QueryParams, SimpleQuery } from "../query";
// -----------------------------------------------------------------------------
/**
 * @module module/module.types
 * @description Replace this line with the module's job to be done — the
 * factory intake's first answer. Never ship
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
 * The SINGLE READ's matrix — every actor refused. Delete this pair (and its
 * `TMatrix` use in `useModuleItem.ts`) for a module with no single-record read.
 *
 * All-`never` is not paperwork. `createScopedComposable`'s `TMatrix` defaults to
 * the WIDE `ActorContextMatrix`, whose every cell is `string`, so a single read
 * that passes no type argument still type-checks `.for("anything", id)` — the
 * hole that deleting the leaf record's context enum was meant to close. This
 * withdraws `.for()` from all four actors and leaves `.as()` untouched.
 *
 * Keep it INTERNAL: it names no context a consumer can spell, so it is not
 * re-exported from the module barrel.
 * @doctrine `templates/SINGLE-READ.md`, "The all-`never` matrix".
 * @precedent `client-email-history/client-email-history.types.ts`
 * `RECEIVED_EMAIL_SCOPE_MATRIX`.
 */
export const MODULE_ITEM_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Single-read scope matrix type (derived from the runtime const above). */
export type ModuleItemScopeMatrix = typeof MODULE_ITEM_SCOPE_MATRIX;

/**
 * One item in the module's collection — the view-model `map{Module}`
 * (`module.mappers.ts`) shapes from the wire type `I{Module}`
 * (`@upmind-automation/types`). Replace the fields with the real view-model.
 * No machine-context type exists in the query variant — the query itself IS
 * the state (`code-composables.md` Part B "State Machine vs TanStack Query").
 */
export type {Module} = {
  id: string;
  /**
   * Present because `use{Module}.context.{actor}.ts`'s own client-exclusive
   * `entitlements` computed reads it. Replace with the module's real
   * per-item fields at intake.
   */
  entitlements?: string[];
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
    params?: Partial<QueryParams<I{Module}[], {Module}[]>>
  ) => ListQuery<I{Module}[], {Module}[]>;
  /**
   * SINGLE-RECORD READ contract — one record by its id. The id is the scope
   * builder's own `.withId(id)`, relayed by `useModuleItem.ts` off `config.id`;
   * it is NOT a scope context, so no context type constrains it and no matrix
   * cell carries it (`templates/SINGLE-READ.md`).
   *
   * Optional `emailId`-style parameter on purpose: an absent id is the
   * un-addressed state, which the implementation must gate to NO request rather
   * than fetch `.../undefined`.
   *
   * Delete this member for a module with no single-record read; a collection
   * that never opens one record does not carry the contract for it.
   */
  loadOne: (id?: {Module}["id"]) => SimpleQuery<I{Module}, {Module}>;
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

// --- The criteria models — the module's ONE request-state type -------------
//
// The queryCriteria schema owns ALL request state: filters, sort, pagination,
// limit. These types are the shape `useQuerySchema()` validates, and the ONLY
// legal route to the wire is `list({ criteria: { schema: useQuerySchema() } })`
// in `module.services.ts`. A hand-rolled filter ref beside that channel, or a
// raw sort string where `SortEntry["field"]` belongs, is the
// criteria-subversion defect the door names.
//
// CONCRETISE all three for the real module: one property per filter the oracle
// supports, and `SortEntry["field"]` narrowed to this module's OWN sortable
// enum — the same list `useQuerySchema()`'s `sort.items.properties.field.enum`
// declares. A bare `string` lets an unschematised field compile and reach ajv
// only to be discarded silently on write.

/**
 * The module's ONE request-state model — the instance validated against
 * `useQuerySchema()`. The query layer's translator maps it to the wire params.
 */
export type QueryModel = {
  filters?: {
    name?: { like?: string };
  };
  sort?: SortEntry[];
  // `offset` alone is unspellable: an offset with no known page size cannot be
  // resolved against a `limit: 0` (unpaged) collection without producing a NaN
  // page index. `limit` alone stays legal — it is the module's documented
  // page-size door, `setCriteria({ pagination: { limit } })`.
  pagination?:
    | { limit?: number; offset?: never }
    | { limit: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link QueryModel}. */
export type FilterModel = NonNullable<QueryModel["filters"]>;

/**
 * One sort entry. Precedence is position — the first entry sorts first.
 * NARROW `field` to this module's own sortable enum; never leave it `string`.
 */
export type SortEntry = { field: "name" | "created_at"; dir: SortDirection };

/** The ordered sort model — the `sort` branch of {@link QueryModel}. */
export type SortModel = NonNullable<QueryModel["sort"]>;

/**
 * The order the list starts in. Declared as the query schema's `sort` default,
 * so an emptied sort refills itself on the next parse.
 */
export const DEFAULT_SORT: SortModel = [
  { field: "created_at", dir: SortDirection.ASC }
];

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
export type ModuleListQuery = ListQuery<I{Module}[], {Module}[]>;
