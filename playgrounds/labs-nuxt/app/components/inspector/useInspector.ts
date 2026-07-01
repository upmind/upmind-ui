// -----------------------------------------------------------------------------
/**
 * @module inspector/useInspector
 * @description Global registry for inspector sections.
 * Pages can register sections that auto-update via computed refs.
 */

import { computed, onUnmounted, ref, shallowRef, triggerRef, watch } from "vue";
import { map } from "lodash-es";
import type { InspectorSection } from "./inspector.types";
import type {
  InspectorItemConfig,
  InspectorItemEntry
} from "./useInspector.types";
// -----------------------------------------------------------------------------

// --- Global state (shared across all component instances)
const registry = shallowRef<Map<string, InspectorItemEntry>>(new Map());
const isOpen = ref(false);

// Auto-close inspector when all sections are removed
watch(
  () => registry.value.size,
  size => {
    if (size === 0) {
      isOpen.value = false;
    }
  }
);

// -----------------------------------------------------------------------------

/**
 * Global inspector registry composable.
 *
 * Use this to register inspector sections from any page component.
 * Registered sections automatically appear in the global Inspector.
 *
 * @example
 * ```ts
 * // In a page component
 * const { register } = useInspector();
 *
 * register({
 *   key: 'my-page-auth',
 *   factory: () => ({
 *     name: 'Auth',
 *     state: currentState.value,
 *     meta: { isLoading: isLoading.value },
 *     context: { model: model.value }
 *   })
 * });
 * ```
 */
export function useInspector() {
  /**
   * Add a section without auto-cleanup.
   * Use when you need manual control over lifecycle.
   */
  function add(config: InspectorItemConfig): void {
    registry.value.set(config.key, {
      key: config.key,
      factory: config.factory
    });
    triggerRef(registry);
  }

  /**
   * Remove a specific section by key.
   */
  function remove(key: string): void {
    registry.value.delete(key);
    triggerRef(registry);
  }

  /**
   * Clear all registered sections.
   * Primarily for testing or full reset.
   */
  function clear(): void {
    registry.value.clear();
    triggerRef(registry);
  }

  /**
   * Toggle the inspector open/closed.
   */
  function toggle(): void {
    isOpen.value = !isOpen.value;
  }

  /**
   * Get all registered sections (reactive).
   * This computed ref updates when registry changes or when factory values change.
   */
  const sections = computed<InspectorSection[]>(() => {
    return map(Array.from(registry.value.values()), entry => entry.factory());
  });

  /**
   * Check if any sections are registered.
   */
  const hasSections = computed(() => registry.value.size > 0);

  /**
   * Register a section with auto-cleanup on component unmount.
   * This is the recommended way to register sections.
   */
  function register(
    config: InspectorItemConfig,
    persistent: boolean = false
  ): void {
    add(config);
    if (!persistent) {
      onUnmounted(() => remove(config.key));
    }
  }

  return {
    /** Add a section without auto-cleanup (manual lifecycle). */
    add,

    /** Register a section with auto-cleanup on unmount (recommended). */
    register,

    /** Remove a specific section by key. */
    remove,

    /** Clear all sections. */
    clear,

    /** Toggle the inspector open/closed. */
    toggle,

    /** Reactive list of all sections. */
    sections,

    /** True if any sections are registered. */
    hasSections,

    /** Reactive open state for the inspector. */
    isOpen
  };
}

// Type export for consumers
export type UseInspector = ReturnType<typeof useInspector>;
