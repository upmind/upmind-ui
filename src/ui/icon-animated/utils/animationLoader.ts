// ---------------------------------------------------------------
// animationLoader.ts – on‑demand animation loader with registration pattern
// ---------------------------------------------------------------

import { ref, computed, type ComputedRef } from "vue";
import { toPairs, split, last, find } from "lodash-es";

// --- types
import type { AnimationImportMap, AnimationEntry } from "../types";

// -----------------------------------------------------------------------------

/** Parsed animation entries for efficient matching */
const animationMap = ref<AnimationEntry[]>([]);

/** Name-based index for O(1) filtering by animation name */
const animationsByName = ref<Record<string, AnimationEntry[]>>({});

/** Whether animations have been registered */
const isRegistered = ref(false);

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Register animations from a Vite glob import map.
 *
 * This must be called by the consuming app before using any IconAnimated components.
 *
 * @param importMap - The result of import.meta.glob("@animations/⁎⁎/⁎.json", { query: "?url", eager: false, import: "default" })
 *
 * @example
 * // In your app's main.ts or entry point:
 * import { registerAnimations } from '@upmind/ui';
 *
 * registerAnimations(import.meta.glob('@animations/⁎⁎/⁎.json', {
 *   query: '?url',
 *   eager: false,
 *   import: 'default'
 * }));
 */
export function registerAnimations(importMap: AnimationImportMap): void {
  // Reset state
  animationMap.value = [];
  animationsByName.value = {};

  // Build animation map and name index
  toPairs(importMap).forEach(([fullPath, loader]) => {
    const filename = last(split(fullPath, /[/\\]/));
    if (!filename || !filename.endsWith(".json")) return;

    // Remove .json extension - use slice instead of trimEnd (which trims character set)
    const name = filename.slice(0, -5);

    const entry: AnimationEntry = {
      fullPath,
      name,
      loader: loader as () => Promise<string>
    };

    animationMap.value.push(entry);

    // Index by name for faster lookups
    if (!animationsByName.value[name]) {
      animationsByName.value[name] = [];
    }
    animationsByName.value[name].push(entry);
  });

  isRegistered.value = true;
}

/**
 * Reactive flag indicating if animations have been registered.
 */
export const hasRegisteredAnimations: ComputedRef<boolean> = computed(
  () => isRegistered.value
);

/**
 * Reactive count of registered animations.
 */
export const getAnimationCount: ComputedRef<number> = computed(
  () => animationMap.value.length
);

/**
 * Load an animation by name.
 *
 * @param name - Animation name without extension
 * @returns Animation URL string if found, undefined otherwise
 *
 * @example
 * const url = await loadAnimation("checkmark");
 */
export async function loadAnimation(name: string): Promise<string | undefined> {
  if (!isRegistered.value) {
    console.warn(
      "Animations not registered. Call registerAnimations() in your app entry point."
    );
    return undefined;
  }

  // Find animation by name
  const candidates = animationsByName.value[name];
  if (!candidates || candidates.length === 0) {
    console.warn("Animation not found in registered animations", { name });
    return undefined;
  }

  // Use the first match
  const entry = candidates[0];
  return entry.loader();
}
