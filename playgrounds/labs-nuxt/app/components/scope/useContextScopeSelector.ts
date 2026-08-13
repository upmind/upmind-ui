// -----------------------------------------------------------------------------
/**
 * @module composables/useContextScopeSelector
 * @description Global context scope management for labs playground.
 * Allows pages to register available context types based on their composable's scope matrix.
 * Syncs with URL context segments.
 *
 * The matrix is always the COMPOSABLE's own (`R6-31`): a page registers what
 * the cell it booted publishes, and a declaration never restates it.
 */

import { useStorage } from "@vueuse/core";
import { computed, onUnmounted, ref } from "vue";
import { resolveMatrixContext } from "../../composables/scope";
import { filter, forEach, map, reject, take, toPairs } from "lodash-es";
import type {
  ActorContextMatrix,
  ScopeActorTypes,
  ScopeContext
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

/**
 * Available context type for a specific actor.
 */
export type AvailableContext = {
  /** Context type (e.g., "client", "lead", "contract") */
  type: string;
  /** Actor this context is available for */
  actor: ScopeActorTypes;
};

/**
 * One row of a registered matrix — the axis AC1.4 greys. A matrix maps ACTOR to
 * context type, so an actor the matrix marks `never` carries a `null` type and
 * is the row that reads as unavailable.
 */
export type ActorContextRow = {
  actor: ScopeActorTypes;
  contextType: string | null;
};

/** A context the user has acted for before, carried with whatever it was called. */
export type RecentContext = ScopeContext & { label?: string };

// --- Global state (shared across all component instances)

// --- Available contexts (can be dynamically modified by pages based on their matrix)
const availableContexts = ref<AvailableContext[]>([]);

// --- The matrix those contexts came from, kept whole so the unsupported actors survive
const registeredMatrix = ref<ActorContextMatrix | null>(null);

// --- Track which component set the contexts (for cleanup)
let contextOwner: symbol | null = null;

// --- Contexts acted for before, newest first. No client search exists in core
//     (ESC4), so what has already been used is half of what can be offered.
const RECENT_LIMIT = 5;
const recentContexts = useStorage<RecentContext[]>(
  "upmind.labs.scope.recent-contexts",
  []
);

// -----------------------------------------------------------------------------

/**
 * Context scope selector composable for managing available contexts across playground pages.
 * Pages call `register()` with their composable's scope matrix to populate the context selector.
 *
 * @example
 * ```ts
 * // In a page using useAuth
 * const { register } = useContextScopeSelector();
 *
 * // Register auth's context matrix on mount
 * register(AUTH_SCOPE_MATRIX);
 * ```
 */
export function useContextScopeSelector() {
  // --- Computed

  /** All unique context types available across all registered actors. */
  const availableContextTypes = computed<string[]>(() => {
    const types = new Set<string>();
    availableContexts.value.forEach(ctx => types.add(ctx.type));
    return Array.from(types);
  });

  /**
   * One row per actor the registered matrix declares, in the matrix's own
   * order — the unsupported actors included, since they are what AC1.4 greys.
   */
  const actorContexts = computed<ActorContextRow[]>(() =>
    map(toPairs(registeredMatrix.value ?? {}), ([actor, contextType]) => ({
      actor: actor as ScopeActorTypes,
      contextType: resolveMatrixContext(contextType)
    }))
  );

  /** Get available context types for a specific actor. */
  function getContextTypesForActor(actor: ScopeActorTypes): string[] {
    return map(
      filter(availableContexts.value, ctx => ctx.actor === actor),
      ctx => ctx.type
    );
  }

  /** True if any contexts are registered. */
  const hasContexts = computed(() => availableContexts.value.length > 0);

  // --- Actions

  /**
   * Register available contexts from a scope matrix with auto-cleanup on component unmount.
   * Extracts context types for each actor and registers them.
   *
   * @param matrix - The composable's scope matrix
   *
   * @example
   * ```ts
   * register(AUTH_SCOPE_MATRIX);
   * // Registers: { type: 'client', actor: ScopeActorTypes.STAFF }
   * ```
   */
  function register<TMatrix extends ActorContextMatrix>(matrix: TMatrix) {
    const owner = Symbol("context-owner");
    contextOwner = owner;

    apply(matrix);

    onUnmounted(() => {
      // Only reset if this component still owns the contexts
      if (contextOwner === owner) {
        reset();
      }
    });
  }

  /** Hold the matrix whole, and the contexts it resolves for each actor. */
  function apply(matrix: ActorContextMatrix) {
    const contexts: AvailableContext[] = [];

    forEach(matrix, (contextType, actor) => {
      const type = resolveMatrixContext(contextType);
      if (!type) return;

      contexts.push({ type, actor: actor as ScopeActorTypes });
    });

    registeredMatrix.value = matrix;
    availableContexts.value = contexts;
  }

  /** Record a context as acted for, newest first, deduped on type + id. */
  function remember(context: RecentContext) {
    recentContexts.value = take(
      [
        context,
        ...reject(
          recentContexts.value,
          entry => entry.type === context.type && entry.id === context.id
        )
      ],
      RECENT_LIMIT
    );
  }

  /**
   * Set available contexts without auto-cleanup.
   * Use when you need manual control over lifecycle.
   */
  function set(contexts: AvailableContext[]) {
    availableContexts.value = contexts;
  }

  /**
   * Reset available contexts to empty.
   */
  function reset() {
    availableContexts.value = [];
    registeredMatrix.value = null;
    contextOwner = null;
  }

  return {
    /** One row per actor the registered matrix declares, unsupported included. */
    actorContexts,

    /** All unique context types available. */
    availableContextTypes,

    /** Available contexts array (type + actor pairs). */
    availableContexts,

    /** Get context types available for specific actor. */
    getContextTypesForActor,

    /** True if any contexts are registered. */
    hasContexts,

    /** Contexts acted for before, newest first. */
    recentContexts,

    /** Register contexts from matrix with auto-cleanup (recommended). */
    register,

    /** Record a context as acted for. */
    remember,

    /** Reset to empty contexts. */
    reset,

    /** Set contexts without auto-cleanup (manual lifecycle). */
    set
  };
}

// Type export for consumers
export type UseContextScopeSelector = ReturnType<
  typeof useContextScopeSelector
>;
