import { ensure } from "./scope.registry";
import { ScopeActorTypes } from "./scope.types";
import { generateScopeKey, resolveSelfActor } from "./scope.utils";
import type {
  ActorContextMatrix,
  ContextsForActor,
  ScopeActor,
  ScopeConfig,
  ScopeContext,
  ScopeKey
} from "./scope.types";
// -----------------------------------------------------------------------------
/**
 * @module scope/builder
 * @description Fluent builder factory for creating scope-based composables.
 */
/**
 * Factory function that creates a composable instance from scope config.
 */
export type ScopedFactory<T, TContextType extends string = string> = (
  config: ScopeConfig<TContextType>,
  scopeKey: ScopeKey
) => T;

/**
 * The single-record `.withId(id)` step, offered at every builder position
 * because the runtime proxy offers it at every position.
 *
 * `.for(type, id)` and `.withId(id)` are NOT interchangeable: a context names an
 * entity the ACTOR acts upon and is constrained by the module's matrix, while an
 * id names the ONE record this instance reads. Marking a leaf record as a
 * synthesised context is what this step replaces — a leaf record was never an
 * ADR-001 context type.
 *
 * @param id - The id of the single record being read
 * @returns Finalized composable
 */
export type ScopeBuilderWithId<T> = {
  withId: (id: string) => T;
};

/**
 * Builder after .for() has been called.
 * Can optionally chain with .inBrand() for explicit brand validation.
 */
export type ScopeBuilderAfterFor<T> = T &
  ScopeBuilderWithId<T> & {
    /**
     * Adds brand filter after context selection.
     * Use this when you want explicit brand validation (BE will validate correlation).
     *
     * @param brandId - The brand ID to filter by
     * @returns Finalized composable
     */
    inBrand: (brandId: string) => T;

    /**
     * Spawns a fresh instance that starts a new session instead of reusing an
     * active one of this scope.
     *
     * @returns Finalized composable
     */
    fresh: () => T;
  };

/**
 * Builder after .inBrand() has been called for staff with contexts.
 * Can optionally chain with .for() to select a specific context.
 */
export type ScopeBuilderAfterBrand<T, TContexts extends string> = T &
  ScopeBuilderWithId<T> & {
    /**
     * Specifies the context entity being acted upon.
     *
     * @param type - The context type (constrained by matrix)
     * @param id - The entity ID
     * @returns Finalized composable
     */
    for: (type: TContexts, id: string) => T;

    /**
     * Spawns a fresh instance that starts a new session instead of reusing an
     * active one of this scope.
     *
     * @returns Finalized composable
     */
    fresh: () => T;
  };

/**
 * Builder for staff when they have valid contexts in the matrix.
 * Both .inBrand() and .for() are available, in either order.
 *
 * Usage patterns:
 * - `.as('staff')` - View all across org
 * - `.as('staff').inBrand('x')` - View all in brand
 * - `.as('staff').for('client', '123')` - Specific client (BE infers brand)
 * - `.as('staff').inBrand('x').for('client', '123')` - Specific client in brand
 * - `.as('staff').for('client', '123').inBrand('x')` - Same as above
 */
export type ScopeBuilderStaffWithContexts<T, TContexts extends string> = T &
  ScopeBuilderWithId<T> & {
    /**
     * Filters by brand.
     * After calling, .for() remains available to select a specific context.
     *
     * @param brandId - The brand ID to filter by
     * @returns Builder with .for() available
     */
    inBrand: (brandId: string) => ScopeBuilderAfterBrand<T, TContexts>;

    /**
     * Specifies the context entity being acted upon.
     * In org mode, BE will infer the brand from the context.
     * After calling, .inBrand() remains available for explicit brand validation.
     *
     * @param type - The context type (constrained by matrix)
     * @param id - The entity ID
     * @returns Builder with .inBrand() available
     */
    for: (type: TContexts, id: string) => ScopeBuilderAfterFor<T>;

    /**
     * Spawns a fresh instance that starts a new session instead of reusing an
     * active one of this scope.
     *
     * @returns Finalized composable
     */
    fresh: () => T;
  };

/**
 * Builder for staff when they have NO valid contexts in the matrix.
 * Only .inBrand() is available.
 */
export type ScopeBuilderStaffNoContexts<T> = T &
  ScopeBuilderWithId<T> & {
    /**
     * Filters by brand.
     *
     * @param brandId - The brand ID to filter by
     * @returns Finalized composable
     */
    inBrand: (brandId: string) => T;

    /**
     * Spawns a fresh instance that starts a new session instead of reusing an
     * active one of this scope.
     *
     * @returns Finalized composable
     */
    fresh: () => T;
  };

/**
 * Result type for staff based on whether they have contexts in matrix.
 *
 * Note: Uses tuple wrapping `[T] extends [never]` to avoid TypeScript's
 * distribution behavior where `never extends X` evaluates to `never`.
 */
export type ScopeBuilderStaffResult<T, TMatrix extends ActorContextMatrix> = [
  ContextsForActor<TMatrix, ScopeActorTypes.STAFF>
] extends [never]
  ? ScopeBuilderStaffNoContexts<T>
  : ScopeBuilderStaffWithContexts<
      T,
      ContextsForActor<TMatrix, ScopeActorTypes.STAFF>
    >;

/**
 * Builder for any non-staff actor when they have valid contexts in the matrix.
 * Only .for() is available (no .inBrand() — brand is determined by session/token).
 *
 * Usage patterns:
 * - `.as('client')` - Client acting as self
 * - `.as('client').for('client', '456')` - Client acting on behalf of child client
 * - `.as('guest').for('lead', '789')` - Guest with lead context (if matrix allows)
 */
export type ScopeBuilderActorWithContexts<T, TContexts extends string> = T &
  ScopeBuilderWithId<T> & {
    /**
     * Specifies the context entity being acted upon.
     *
     * @param type - The context type (constrained by matrix)
     * @param id - The entity ID
     * @returns Finalized composable
     */
    for: (type: TContexts, id: string) => T;

    /**
     * Spawns a fresh instance that starts a new session instead of reusing an
     * active one of this scope.
     *
     * @returns Finalized composable
     */
    fresh: () => T;
  };

/**
 * Result type for any actor based on actor type.
 * Maps each actor to the appropriate return type.
 *
 * - STAFF: Gets .inBrand() and optionally .for() (based on matrix)
 * - All others: Gets .for() only when matrix defines contexts for that actor
 *
 * Every branch also gets .withId() — a single-record read marks its record
 * regardless of actor, and the matrix constrains contexts, not record ids.
 */
export type ScopeBuilderResult<
  T,
  TMatrix extends ActorContextMatrix,
  TActor extends ScopeActorTypes
> = TActor extends ScopeActorTypes.STAFF
  ? ScopeBuilderStaffResult<T, TMatrix>
  : [ContextsForActor<TMatrix, TActor>] extends [never]
    ? T & ScopeBuilderWithId<T>
    : ScopeBuilderActorWithContexts<T, ContextsForActor<TMatrix, TActor>>;

/**
 * Builder after .withId() has been called at the ROOT, before any actor is
 * named. The instance is already readable — a missing actor resolves to SELF —
 * and .as() stays available for a caller that names one explicitly.
 */
export type ScopeBuilderAfterId<T, TMatrix extends ActorContextMatrix> = T & {
  /**
   * Specifies the actor performing the action.
   *
   * @param actor - The actor type (use ScopeActorTypes enum)
   * @returns Composable instance for that actor
   */
  as<TActor extends ScopeActorTypes>(
    actor: TActor
  ): ScopeBuilderResult<T, TMatrix, TActor>;
};

/**
 * Builder interface with fluent chaining.
 * Returns different types based on actor type and matrix:
 * - SELF: Returns T (runtime resolution, no chaining)
 * - GUEST: Returns T, or T & { for } if matrix defines contexts for guest
 * - CLIENT: Returns T, or T & { for } if matrix defines contexts for client
 * - STAFF: Returns T with .inBrand(), and optionally .for() if matrix defines contexts
 *
 * `.as()` is optional: an unnamed actor resolves to SELF, so a single-record
 * read may open straight onto `.withId(id)`.
 */
export type ScopeBuilder<T, TMatrix extends ActorContextMatrix> = {
  /**
   * Specifies the actor performing the action.
   * Returns the composable instance, optionally with additional scoping methods.
   *
   * @param actor - The actor type (use ScopeActorTypes enum)
   * @returns Composable instance (staff gets .inBrand()/.for(); other actors get .for() when matrix defines contexts)
   */
  as<TActor extends ScopeActorTypes>(
    actor: TActor
  ): ScopeBuilderResult<T, TMatrix, TActor>;

  /**
   * Marks the ONE record this instance reads, with SELF as the actor unless a
   * later `.as()` names another.
   *
   * @param id - The id of the single record being read
   * @returns Composable instance, with .as() still available
   */
  withId(id: string): ScopeBuilderAfterId<T, TMatrix>;

  /**
   * Spawns a fresh instance that starts a new session instead of reusing an
   * active one of this scope.
   *
   * @returns Finalized composable
   */
  fresh: () => T;
};

/**
 * A scoped composable: the builder factory, carrying the module's OWN matrix as
 * a value. The matrix is otherwise a type parameter only, so nothing holding the
 * composable reference could read which actors it is offerable at without the
 * module restating it somewhere else.
 */
export type ScopedComposable<
  T,
  TMatrix extends ActorContextMatrix
> = (() => ScopeBuilder<T, TMatrix>) & {
  /** Which actors this module resolves a context for, and under which type. */
  scopeMatrix?: TMatrix;
};
// -----------------------------------------------------------------------------
/**
 * Creates a scope-based composable with fluent chaining API.
 * The matrix type parameter enforces which contexts are valid for each actor.
 *
 * @param name - Unique name for this composable (used in scope key)
 * @param factory - Factory function that creates the composable instance
 * @param scopeMatrix - The module's own matrix VALUE, carried onto the returned
 * composable so a consumer holding the reference can read which actors it is
 * offerable at. Type-checked against `TMatrix`, so the declared type and the
 * exported const cannot drift apart.
 * @returns A function that returns a fluent builder
 *
 * @example
 * ```typescript
 * // Module defines its own context types
 * enum BasketContextTypes {
 *   CLIENT = 'client',
 *   LEAD = 'lead'
 * }
 *
 * // Define actor-context matrix for this module
 * type BasketMatrix = {
 *   self: never;
 *   staff: `${BasketContextTypes}`;
 *   client: never;
 *   guest: never;
 * }
 *
 * const useBasket = createScopedComposable<BasketComposable, BasketMatrix>(
 *   'basket',
 *   (config, scopeKey) => ({
 *     useMeta: () => ({ isLoading: computed(() => false) }),
 *     useActions: () => ({ refresh: () => {} })
 *   })
 * )
 *
 * // Usage patterns by actor:
 * useBasket().as('self')                                  // ✓ Returns T (runtime resolution)
 * useBasket().as('guest')                                 // ✓ Returns T (no chaining)
 * useBasket().as('client')                                // ✓ Returns T (no chaining)
 *
 * // Client patterns (if matrix defines contexts for client):
 * // useBasket().as('client').for('client', '456')          // ✓ Child client context
 *
 * // Staff patterns (has contexts in matrix):
 * useBasket().as('staff')                                 // ✓ View all across org
 * useBasket().as('staff').inBrand('brand-1')              // ✓ View all in brand
 * useBasket().as('staff').for('client', '123')            // ✓ Specific client (BE infers brand)
 * useBasket().as('staff').inBrand('x').for('client', '1') // ✓ Client in specific brand
 * useBasket().as('staff').for('client', '1').inBrand('x') // ✓ Same as above
 * useBasket().as('staff').for('ticket', '123')            // ✗ Type error - not in matrix
 *
 * // Single-record read patterns (no matrix needed — an id is not a context):
 * useBasket().withId('123')                               // ✓ SELF reads record 123
 * useBasket().as('staff').withId('123')                   // ✓ Staff reads record 123
 * ```
 */
export function createScopedComposable<
  T,
  TMatrix extends ActorContextMatrix = ActorContextMatrix
>(
  name: string,
  factory: ScopedFactory<T>,
  scopeMatrix?: TMatrix
): ScopedComposable<T, TMatrix> {
  // Typed here and assigned member-wise rather than merged with a helper: a
  // module registers its composable at MODULE scope, where an imported binding
  // from this file's own cyclic graph is still in its TDZ (the load-order note
  // at the head of every consuming `use*.ts`).
  const composable: ScopedComposable<T, TMatrix> = (): ScopeBuilder<
    T,
    TMatrix
  > => {
    const config: ScopeConfig = {} as ScopeConfig;
    let instance: T | null = null;

    /**
     * @decision
     * what:     A caller that never calls `.as()` resolves to SELF rather than
     *           finalising on an undefined actor.
     *
     * why:      (1) ADR-001 requires `.as()` always, and that reads as a
     *               deliberate rule only while every scope is an actor
     *               question. A single-record read is not: `.withId(id)` names
     *               the record, and the actor is simply whoever is logged in —
     *               which is exactly what SELF means. Forcing `.as('self')`
     *               there makes the caller restate the default.
     *           (2) The alternative is not "an error" — it is
     *               `resolveSelfActor(undefined)` returning `undefined` and the
     *               instance keying under `name:undefined`. The absent actor
     *               was already silently accepted; this makes it mean the one
     *               thing it can mean.
     *           (3) Resolution stays HERE, in the builder (variance-law clause
     *               4). No module factory or services file gains a SELF branch.
     *
     * rejected: Throw on a missing actor. Rejected because it is a breaking
     *           change to a public surface for 18 existing composables in
     *           service of a rule ADR-001 wrote before the single-read case
     *           existed, and because the throw would fire at first property
     *           read — inside a lazily-finalising Proxy, i.e. far from the call
     *           site that omitted `.as()`.
     *
     *           Also rejected: default to GUEST. That is what
     *           `resolveSelfActor` falls back to when there is NO session, and
     *           it is the right answer only then. Defaulting to it outright
     *           would serve a logged-in client the guest scope.
     *
     * @operator-ruling 2026-08-19 (FE-3095) — ADR-001 amendment note owed; see
     * `docs/adr/001-scope-based-composables.md`.
     */
    const finalize = (): T => {
      if (!instance) {
        const resolvedActor = resolveSelfActor(
          config.actor ?? ScopeActorTypes.SELF
        );
        const resolvedConfig: ScopeConfig = { ...config, actor: resolvedActor };
        const key = generateScopeKey(name, resolvedConfig);
        instance = ensure(key, () => factory(resolvedConfig, key));
      }
      return instance;
    };

    const builderMethods: {
      [key: string]:
        | ((actor: ScopeActor) => ScopeBuilder<T, TMatrix>)
        | ((type: string, id: string) => ScopeBuilder<T, TMatrix>)
        | ((id: string) => ScopeBuilder<T, TMatrix>)
        | (() => ScopeBuilder<T, TMatrix>);
    } = {
      as(actor: ScopeActor) {
        config.actor = actor;
        instance = null;
        return proxy;
      },
      for(type: string, id: string) {
        config.context = { type, id } as ScopeContext;
        instance = null;
        return proxy;
      },
      withId(id: string) {
        config.id = id;
        instance = null;
        return proxy;
      },
      inBrand(brandId: string) {
        config.brandId = brandId;
        instance = null;
        return proxy;
      },
      fresh() {
        config.newSession = true;
        instance = null;
        return proxy;
      }
    };

    const proxy = new Proxy({} as ScopeBuilder<T, TMatrix>, {
      get(_, prop: string | symbol) {
        if (typeof prop === "string" && prop in builderMethods) {
          return builderMethods[prop];
        }
        return (finalize() as Record<string | symbol, unknown>)[prop];
      },
      has(_, prop: string | symbol) {
        if (typeof prop === "string" && prop in builderMethods) return true;
        return prop in (finalize() as object);
      },
      ownKeys() {
        return Reflect.ownKeys(finalize() as object);
      },
      getOwnPropertyDescriptor(_, prop: string | symbol) {
        return Object.getOwnPropertyDescriptor(finalize() as object, prop);
      }
    });

    return proxy;
  };

  composable.scopeMatrix = scopeMatrix;

  return composable;
}
