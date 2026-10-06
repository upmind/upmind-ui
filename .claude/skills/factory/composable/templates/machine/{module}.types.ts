// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ScopeContext } from "../scope/scope.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/module.types
 * @description Module vocabulary: scope matrix, machine context, models and
 * the services and schemas contracts.
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

export type ModuleModel = Record<string, unknown>;

export type ModuleContext = {
  scopeActor?: ScopeActorTypes;
  scopeContext?: ScopeContext<`${ModuleContextTypes}`>;
  brandId?: string;
  model?: ModuleModel;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  lookups?: Record<string, unknown>[];
  error?: unknown;
};

export type ModuleServices = {
  register?: (
    context: ModuleContext,
    event: AnyEventObject
  ) => Promise<unknown>;
  registerAsGuest?: (
    context: ModuleContext,
    event: AnyEventObject
  ) => Promise<unknown>;
};

export type ModuleSchemas = {
  useModuleSchemaParser: () => JsonSchema;
  useModuleUischemaParser: () => UISchemaElement;
};
