// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ListQuery, SimpleQuery } from "../query";
import type { SortDirection } from "../query/query.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { I{Module} } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module module/module.types
 * @description Module vocabulary: scope matrices, models, request state and
 * the services contract.
 */

export enum ModuleContextTypes {
  CLIENT = AccessRoleTypes.CLIENT
}

export const MODULE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: ModuleContextTypes.CLIENT,
  [ScopeActorTypes.CLIENT]: ModuleContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

export type ModuleScopeMatrix = typeof MODULE_SCOPE_MATRIX;

// A record id rides on `.withId(id)`, so the single read withdraws `.for()`
// from every actor; without this matrix the wide default accepts any context.
export const MODULE_ITEM_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

export type ModuleItemScopeMatrix = typeof MODULE_ITEM_SCOPE_MATRIX;

export type {Module} = {
  id: string;
  entitlements?: string[];
};

export type ModuleModel = Record<string, unknown>;

export type ModuleServices = {
  loadList: () => ListQuery<I{Module}[], {Module}[]>;
  loadOne: (id?: {Module}["id"]) => SimpleQuery<I{Module}, {Module}>;
  login: (model: ModuleModel) => Promise<unknown>;
  queryKey: QueryKey;
  register?: (model: ModuleModel) => Promise<unknown>;
  registerAsGuest?: () => Promise<unknown>;
};

export type QueryModel = {
  filters?: {
    name?: { like?: string };
  };
  sort?: SortEntry[];
  // An offset without a page size cannot resolve to a page.
  pagination?:
    | { limit?: number; offset?: never }
    | { limit: number; offset?: number };
};

export type FilterModel = NonNullable<QueryModel["filters"]>;

export type SortEntry = { field: "name" | "created_at"; dir: SortDirection };

export type SortModel = NonNullable<QueryModel["sort"]>;

export type ModuleListQuery = ListQuery<I{Module}[], {Module}[]>;
