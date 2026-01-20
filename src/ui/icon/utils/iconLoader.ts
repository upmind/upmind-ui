// ---------------------------------------------------------------
// iconLoader.ts – on‑demand SVG loader with in‑memory cache & fallback logic
// ---------------------------------------------------------------

import { ref, computed, type ComputedRef } from "vue";

import {
  toPairs,
  get,
  set,
  isObject,
  split,
  last,
  includes,
  every,
  find,
  trimEnd
} from "lodash-es";

// --- types
import type { IconEntry, IconImportMap, LoadIconOptions } from "../types";

// -----------------------------------------------------------------------------

/** Simple in‑memory cache – lives for the page lifetime */
const cache: Record<string, string> = {};

/** Parsed icon entries for efficient matching */
const iconMap = ref<IconEntry[]>([]);

/** Name-based index for O(1) filtering by icon name */
const iconsByName = ref<Record<string, IconEntry[]>>({});

/** Whether icons have been registered */
const isRegistered = ref(false);

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Register icons from a Vite glob import map.
 *
 * This must be called by the consuming app before using any Icon components.
 *
 * @param importMap - The result of import.meta.glob("@icons/⁎⁎/⁎.svg", { query: "?raw", eager: false, import: "default" })
 *
 * @example
 * // In your app's main.ts or entry point:
 * import { registerIcons } from '@upmind/ui';
 *
 * registerIcons(import.meta.glob('@icons/⁎⁎/⁎.svg', {
 *   query: '?raw',
 *   eager: false,
 *   import: 'default'
 * }));
 */
export function registerIcons(importMap: IconImportMap): void {
  // Reset state
  iconMap.value = [];
  iconsByName.value = {};

  // Build icon map and name index
  toPairs(importMap).forEach(([fullPath, loader]) => {
    const filename = last(split(fullPath, /[/\\]/));
    if (!filename || !filename.endsWith(".svg")) return;

    const name = trimEnd(filename, ".svg");

    const entry: IconEntry = {
      fullPath,
      name,
      loader: loader as () => Promise<string>
    };

    iconMap.value.push(entry);

    // Index by name for faster lookups
    if (!iconsByName.value[name]) {
      iconsByName.value[name] = [];
    }
    iconsByName.value[name].push(entry);
  });

  isRegistered.value = true;
}

/**
 * Reactive flag indicating if icons have been registered.
 */
export const hasRegisteredIcons: ComputedRef<boolean> = computed(
  () => isRegistered.value
);

/**
 * Reactive count of registered icons.
 */
export const getIconCount: ComputedRef<number> = computed(
  () => iconMap.value.length
);

/**
 * Load an SVG icon by name with optional variant and path matching.
 *
 * @param icon - Icon name as string, or object with `name` and optional `path`
 * @param opts - Loading options (variant, fallback)
 * @returns Raw SVG string if found, undefined otherwise
 *
 * @example
 * // Load by name only (searches Global folder)
 * await loadIcon("arrow-right", { variant: "Line" });
 *
 * @example
 * // Load with specific path
 * await loadIcon({ name: "us", path: "Flags" }, { variant: "Global" });
 */
export async function loadIcon(
  icon: string | { name: string; path?: string },
  opts: LoadIconOptions
): Promise<string | undefined> {
  if (!isRegistered.value) {
    console.warn(
      "Icons not registered. Call registerIcons() in your app entry point."
    );
    return undefined;
  }

  const { variant, fallback = true } = opts;

  const safePath = isObject(icon) ? get(icon, "path", "") : "";
  const safeName = isObject(icon) ? get(icon, "name", "") : icon;

  // Try variant match first (if variant provided)
  if (variant) {
    const variantMatch = findIcon(safeName, variant, safePath);
    if (variantMatch) {
      const cacheKey = safePath
        ? `${variant}/${safePath}/${safeName}`
        : `${variant}/${safeName}`;
      return loadAndCache(variantMatch, cacheKey);
    }
  }

  // Fallback to Global
  if (!variant || fallback) {
    const globalMatch = findIcon(safeName, "Global", safePath);
    if (globalMatch) {
      const cacheKey = safePath
        ? `Global/${safePath}/${safeName}`
        : `Global/${safeName}`;
      return loadAndCache(globalMatch, cacheKey);
    }
  }

  console.warn("Icon not found in registered Icons", {
    variant,
    safeName,
    safePath
  });
  return undefined;
}

/**
 * Load an icon and cache the result.
 *
 * @param entry - The icon entry to load
 * @param cacheKey - Unique key for caching
 * @returns The raw SVG string
 */
const loadAndCache = async (
  entry: IconEntry,
  cacheKey: string
): Promise<string> => {
  const cached = get(cache, cacheKey);
  if (cached) return cached as string;

  const rawSvg = await entry.loader();
  set(cache, cacheKey, rawSvg);
  return rawSvg;
};

/**
 * Find an icon matching the provided criteria.
 *
 * Uses segment-based matching to compare path components:
 * 1. Name must match exactly (filename without extension)
 * 2. Variant must exist in path segments (if provided)
 * 3. All path segments must exist in entry path (if provided)
 *
 * @param name - Icon name without extension
 * @param variant - Required variant folder (e.g., "Duocolor", "Global")
 * @param path - Optional subfolder path (e.g., "Flags" or "Flags/Country")
 * @returns Matching IconEntry or undefined
 */
const findIcon = (
  name: string,
  variant?: string,
  path?: string
): IconEntry | undefined => {
  // Use name index for O(1) initial filter
  const candidates = iconsByName.value[name];

  return find(candidates, entry => {
    const segments = split(entry.fullPath, /[/\\]/);

    // Variant must match (if provided)
    if (variant && !includes(segments, variant)) return false;

    // Path segments must all exist (if provided)
    if (path) {
      const pathSegments = split(path, /[/\\]/);
      if (!every(pathSegments, seg => includes(segments, seg))) return false;
    }

    return true;
  });
};
