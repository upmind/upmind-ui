/**
 * @graphify-citation `graphify query "withId single record id scope builder
 * method"` against `graphify-out/graph.json` (2026-08-19, 20286 nodes) returns
 * no `withId`, no `ScopeBuilderWithId`, and no single-record-id construct
 * anywhere in the tree — the `.withId(id)` surface added below is new ground,
 * not a duplicate of something the graph already exposes. Every other member
 * here (`ScopeActor`, `ScopeContext`, `ScopeConfig`, `ActorContextMatrix`) is
 * pre-existing and consumed unchanged. See `graphify-out/GRAPH_REPORT.md`.
 */
/**
 * @graphify-citation `graphify query "ScopeContextPatterns SelectorContext
 * ScopeContextDeclaration"` and `"IdContextsForActor BareContextsForActor
 * ScopeForStep"` against `graphify-out/graph.json` (2026-09-15, 28202 nodes /
 * 59133 edges) both return no matching nodes; `"resolveContextDeclaration
 * selector context pattern"` returns 102 nodes, none of them a scope construct
 * (the only `selector` node is an unrelated product-picker component). The
 * per-member context-pattern declaration added below is new ground, not a
 * duplicate of something the graph already exposes. Every member it reuses —
 * `ActorContextMatrix`, `ContextsForActor`, `ScopeContext` — is pre-existing.
 * See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
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
 * The two mutually exclusive context patterns a matrix member may declare.
 *
 * A string enum so the pattern is readable in DevTools and in a scope URL.
 * New ground — see this file's head `graphify-out/` citation.
 */
export enum ScopeContextPatterns {
  /** `.for(type, id)` — the id names the entity the actor acts upon. REQUIRED. */
  RETARGET = "retarget",
  /** `.for(type)` — the type IS the whole answer. An id is FORBIDDEN. */
  SELECTOR = "selector"
}

/**
 * The declaration a matrix cell carries for a SELECTOR member. Minted by
 * `selector()` — a bare string declares a RETARGET member and needs no wrapper.
 */
export type SelectorContext<TContextType extends string = string> = {
  readonly pattern: ScopeContextPatterns.SELECTOR;
  readonly type: TContextType;
};

/**
 * What a matrix cell may hold for one member: a bare string (RETARGET) or a
 * `selector()` wrapper (SELECTOR).
 */
export type ScopeContextDeclaration<TContextType extends string = string> =
  | TContextType
  | SelectorContext<TContextType>;

/**
 * The declarations a cell holds, as a union. A cell may hold ONE declaration or
 * a readonly array of them, and every consumer reads through this so neither
 * form needs its own branch. A `string` does not extend `readonly unknown[]`,
 * so a single-declaration cell falls through unchanged.
 */
export type DeclarationsInCell<TCell> = TCell extends readonly (infer TMember)[]
  ? TMember
  : TCell;

/**
 * Actor-to-context matrix type.
 * Each module defines which contexts are valid for each actor, and which
 * pattern each context member is: a bare string declares RETARGET, a
 * `selector()` wrapper declares SELECTOR. A cell may hold one declaration or a
 * readonly array of them (ADR-001 amendment 2026-09-15).
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
 *
 * @example
 * ```typescript
 * // A mixed cell — one retarget member and two selector members for one actor:
 * const CUSTOM_FIELDS_SCOPE_MATRIX = {
 *   [ScopeActorTypes.SELF]: null as never,
 *   [ScopeActorTypes.STAFF]: null as never,
 *   [ScopeActorTypes.CLIENT]: [
 *     CustomFieldsContextTypes.VALUES,
 *     selector(CustomFieldsContextTypes.INVOICE),
 *     selector(CustomFieldsContextTypes.CANCEL_REQUEST)
 *   ],
 *   [ScopeActorTypes.GUEST]: null as never
 * } as const;
 * ```
 */
export type ActorContextMatrix<
  TMatrix extends Partial<
    Record<
      ScopeActorTypes,
      ScopeContextDeclaration | readonly ScopeContextDeclaration[] | never
    >
  > = Partial<
    Record<
      ScopeActorTypes,
      ScopeContextDeclaration | readonly ScopeContextDeclaration[] | never
    >
  >
> = TMatrix;

/**
 * A specific context instance — type, and an id only when the member's declared
 * pattern is RETARGET.
 */
export type ScopeContext<TContextType extends string = string> = {
  type: TContextType;
  /**
   * The entity the actor acts upon. Present for a RETARGET context, absent for
   * a SELECTOR context — the two patterns are mutually exclusive and the matrix
   * declares which a member is (ADR-001 amendment 2026-09-15).
   */
  id?: string;
};

/**
 * Full scope configuration for a composable instance.
 */
export type ScopeConfig<TContextType extends string = string> = {
  /** The actor performing the action. */
  actor: ScopeActor;

  /** Optional context the actor is operating upon. */
  context?: ScopeContext<TContextType>;

  /**
   * Optional id of the ONE record this instance reads. Set via the builder's
   * `.withId()`.
   *
   * A leaf record is NOT a context: a context names an entity the ACTOR acts
   * upon (`client`, `contract`, `invoice`), while this names the single record
   * being read. Same id resolves to the same instance; a new id mints a new one.
   *
   * New member of the already-cited `ScopeConfig` — see this file's head
   * `graphify-out/` citation.
   */
  id?: string;

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
 * The RETARGET members of an actor's cell — `.for(type, id)`'s first argument.
 * `never` when the actor declares no retarget member, which makes the
 * two-argument overload uncallable for that actor.
 *
 * New ground — see this file's head `graphify-out/` citation.
 */
export type IdContextsForActor<
  TMatrix extends ActorContextMatrix,
  TActor extends ScopeActorTypes
> = Extract<DeclarationsInCell<ContextsForActor<TMatrix, TActor>>, string>;

/**
 * The SELECTOR members of an actor's cell, unwrapped to their context type —
 * `.for(type)`'s only argument. `never` when the actor declares no selector
 * member, which makes the one-argument overload uncallable for that actor.
 */
export type BareContextsForActor<
  TMatrix extends ActorContextMatrix,
  TActor extends ScopeActorTypes
> =
  DeclarationsInCell<ContextsForActor<TMatrix, TActor>> extends infer TDecl
    ? TDecl extends SelectorContext<infer TContextType>
      ? TContextType
      : never
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
