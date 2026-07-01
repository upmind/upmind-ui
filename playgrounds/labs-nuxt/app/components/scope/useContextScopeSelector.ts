// -----------------------------------------------------------------------------
/**
 * @module composables/useContextScopeSelector
 * @description Global context scope management for labs playground.
 * Allows pages to register available context types based on their composable's scope matrix.
 * Syncs with URL context segments.
 */

import { computed, onUnmounted, ref } from "vue";
import { filter, forEach, map } from "lodash-es";
import type {
  ActorContextMatrix,
  ScopeActorTypes
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

// --- Global state (shared across all component instances)

// --- Available contexts (can be dynamically modified by pages based on their matrix)
const availableContexts = ref<AvailableContext[]>([]);

// --- Track which component set the contexts (for cleanup)
let contextOwner: symbol | null = null;

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

    // Extract contexts from matrix
    const contexts: AvailableContext[] = [];

    forEach(matrix, (contextType, actor) => {
      // Skip if no context for this actor (null/never)
      if (!contextType || contextType === "never") return;

      contexts.push({
        type: contextType as string,
        actor: actor as ScopeActorTypes
      });
    });

    availableContexts.value = contexts;

    onUnmounted(() => {
      // Only reset if this component still owns the contexts
      if (contextOwner === owner) {
        reset();
      }
    });
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
    contextOwner = null;
  }

  return {
    /** All unique context types available. */
    availableContextTypes,

    /** Available contexts array (type + actor pairs). */
    availableContexts,

    /** Get context types available for specific actor. */
    getContextTypesForActor,

    /** True if any contexts are registered. */
    hasContexts,

    /** Register contexts from matrix with auto-cleanup (recommended). */
    register,

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
