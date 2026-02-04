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
  find
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
 * Expected folder structure:
 * - Root icons (default): `assets/<name>.svg` or `assets/<subfolder>/<name>.svg`
 * - Variant icons (packs): `assets/packs/<variant>/<name>.svg`
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

    // Remove .svg extension - use slice instead of trimEnd (which trims character set)
    const name = filename.slice(0, -4);

    // Determine if this is a pack variant or root icon
    const segments = split(fullPath, /[/\\]/);
    const packsIndex = segments.indexOf("packs");

    // If "packs" is in the path and there's a folder after it, that's the variant
    const pack =
      packsIndex !== -1 && segments[packsIndex + 1]
        ? segments[packsIndex + 1]
        : undefined;

    const entry: IconEntry = {
      fullPath,
      name,
      pack, // undefined for root icons, variant name for pack icons
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
 * Load an SVG icon by name with optional variant (pack) and path matching.
 *
 * @param icon - Icon name as string, or object with `name` and optional `path`
 * @param opts - Loading options (variant/pack, fallback)
 * @returns Raw SVG string if found, undefined otherwise
 *
 * @example
 * // Load by name only (searches root icons first, then fallback)
 * await loadIcon("arrow-right", { variant: "Line" });
 *
 * @example
 * // Load with specific subfolder path
 * await loadIcon({ name: "ng", path: "Flags" });
 */
export async function loadIcon(
  icon: string | { name: string; path?: string },
  opts: LoadIconOptions = {}
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

  // Try variant/pack match first (if variant provided)
  if (variant) {
    const packMatch = findIcon(safeName, variant, safePath);
    if (packMatch) {
      const cacheKey = safePath
        ? `packs/${variant}/${safePath}/${safeName}`
        : `packs/${variant}/${safeName}`;
      return loadAndCache(packMatch, cacheKey);
    }
  }

  // Fallback to root icons (no pack)
  if (!variant || fallback) {
    const rootMatch = findIcon(safeName, undefined, safePath);
    if (rootMatch) {
      const cacheKey = safePath
        ? `root/${safePath}/${safeName}`
        : `root/${safeName}`;
      return loadAndCache(rootMatch, cacheKey);
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
 * Logic:
 * 1. Name must match exactly (filename without extension)
 * 2. If pack is provided, icon must be in packs/<pack>/
 * 3. If pack is undefined, icon must NOT be in any pack (root icon)
 * 4. Path segments must all exist in entry path (if provided)
 *
 * @param name - Icon name without extension
 * @param pack - Variant pack name (e.g., "Duocolor", "Line"), or undefined for root icons
 * @param path - Optional subfolder path (e.g., "Flags" or "Flags/Country")
 * @returns Matching IconEntry or undefined
 */
const findIcon = (
  name: string,
  pack?: string,
  path?: string
): IconEntry | undefined => {
  // Use name index for O(1) initial filter
  const candidates = iconsByName.value[name];

  return find(candidates, entry => {
    // Pack matching: either both undefined (root) or both match
    if (pack) {
      // Looking for a specific pack - entry must have matching pack
      if (entry.pack !== pack) return false;
    } else {
      // Looking for root icon - entry must NOT have a pack
      if (entry.pack !== undefined) return false;
    }

    // Path segments must all exist (if provided)
    if (path) {
      const segments = split(entry.fullPath, /[/\\]/);
      const pathSegments = split(path, /[/\\]/);
      if (!every(pathSegments, seg => includes(segments, seg))) return false;
    }

    return true;
  });
};
