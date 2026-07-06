import { AccessRoleTypes } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module scope/types
 * @description Core type definitions for scope-based composable architecture.
 */
/**
 * Enum for scope actor types used throughout the composable architecture.
 * Includes SELF for dynamic resolution of the current session's actor.
 */
export enum ScopeActorTypes {
  SELF = "self", // Use current session actor
  GUEST = AccessRoleTypes.GUEST,
  CLIENT = AccessRoleTypes.CLIENT,
  STAFF = AccessRoleTypes.STAFF
}

/**
 * Union of concrete actor types (excludes SELF which is resolved at runtime).
 * Use this when you need to work with resolved actors.
 */
export type ConcreteActorTypes = Exclude<ScopeActorTypes, ScopeActorTypes.SELF>;

/**
 * Actor type for scope-based composables.
 * Includes SELF for dynamic resolution.
 */
export type ScopeActor = `${ScopeActorTypes}`;

/**
 * Actor-to-context matrix type.
 * Each module defines which contexts are valid for each actor.
 * Context types are defined by the module itself (typically as an enum).
 *
 * Note: SELF is included in the matrix but should map to `never` since
 * it's resolved to a concrete actor at runtime before context lookup.
 *
 * @example
 * ```typescript
 * // In basket module:
 * enum BasketContextTypes {
 *   CLIENT = 'client',
 *   LEAD = 'lead'
 * }
 *
 * const BASKET_SCOPE_MATRIX = {
 *   [ScopeActorTypes.SELF]: null as never,
 *   [ScopeActorTypes.STAFF]: 'client' as `${BasketContextTypes}`,
 *   [ScopeActorTypes.CLIENT]: null as never,
 *   [ScopeActorTypes.GUEST]: null as never
 * } as const;
 *
 * type BasketMatrix = typeof BASKET_SCOPE_MATRIX;
 * ```
 */
export type ActorContextMatrix<
  TMatrix extends Partial<Record<ScopeActorTypes, string | never>> = Partial<
    Record<ScopeActorTypes, string | never>
  >
> = TMatrix;

/**
 * A specific context instance — type and ID.
 */
export type ScopeContext<TContextType extends string = string> = {
  type: TContextType;
  id: string;
};

/**
 * Full scope configuration for a composable instance.
 */
export type ScopeConfig<TContextType extends string = string> = {
  /** The actor performing the action. */
  actor: ScopeActor;

  /** Optional context the actor is operating upon. */
  context?: ScopeContext<TContextType>;

  /** Optional brand filter (not a context). */
  brandId?: string;

  /**
   * When true, spawns a fresh instance (distinct scope key) that starts a new
   * session instead of reusing an active one. Set via the builder's .fresh().
   */
  newSession?: boolean;
};

/**
 * Unique key for singleton instance lookup.
 * Generated from ScopeConfig: "basket:staff:client:123:brand-abc"
 */
export type ScopeKey = string;

/**
 * Helper type to extract valid context types for a given actor from a matrix.
 * Returns `never` if the actor has no valid contexts or isn't in the matrix.
 *
 * Note: For SELF, this returns `never` since SELF should be resolved to a
 * concrete actor before context lookup.
 */
export type ContextsForActor<
  TMatrix extends ActorContextMatrix,
  TActor extends ScopeActorTypes
> = TActor extends keyof TMatrix
  ? Exclude<TMatrix[TActor], undefined | never>
  : never;

/**
 * Helper type to extract ALL valid context types from a matrix.
 * Returns the union of all contexts across all concrete actors.
 * Used for SELF where the actual actor is unknown at compile time.
 */
export type AllContextsFromMatrix<TMatrix extends ActorContextMatrix> =
  | ContextsForActor<TMatrix, ScopeActorTypes.GUEST>
  | ContextsForActor<TMatrix, ScopeActorTypes.CLIENT>
  | ContextsForActor<TMatrix, ScopeActorTypes.STAFF>;

/**
 * Helper type to check if an actor has any valid contexts.
 */
export type HasContexts<
  TMatrix extends ActorContextMatrix,
  TActor extends ScopeActorTypes
> = ContextsForActor<TMatrix, TActor> extends never ? false : true;

/**
 * Helper type to check if ANY actor in the matrix has valid contexts.
 * Used to determine if SELF should expose `.for()`.
 */
export type MatrixHasAnyContexts<TMatrix extends ActorContextMatrix> = [
  AllContextsFromMatrix<TMatrix>
] extends [never]
  ? false
  : true;
