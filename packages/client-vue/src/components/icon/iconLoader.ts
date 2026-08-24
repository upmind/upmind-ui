// -----------------------------------------------------------------------------
/**
 * @module components/icon/iconLoader
 * @description On-demand SVG loader with in-memory cache & fallback logic.
 * Re-homed from `@upmind/ui` so the legacy string-name shim
 * lives in client-vue (the new lib stays lucide-only). Serves the content
 * assets lucide has no equivalent for — country flags, provider logos — plus
 * any UI glyph not yet in the lucide name-map.
 */
import { ref, computed, type ComputedRef } from "vue";
import {
  toPairs,
  get,
  set,
  isObject,
  isEmpty,
  isNil,
  some,
  split,
  last,
  includes,
  every,
  find
} from "lodash-es";
import type { IconEntry, IconImportMap, LoadIconOptions } from "./types";
// -----------------------------------------------------------------------------

/** Simple in-memory cache – lives for the page lifetime */
const cache: Record<string, string> = {};

/** Parsed icon entries for efficient matching */
const iconMap = ref<IconEntry[]>([]);

/** Name-based index for O(1) filtering by icon name */
const iconsByName = ref<Record<string, IconEntry[]>>({});

/** Whether icons have been registered */
const isRegistered = ref(false);

/** Active icon pack (e.g. "Line", "Duocolor") — config/theme driven. */
const activeIconVariant = ref<string>("");
// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Set the active icon pack. Called by the theming layer so the SVG-fallback
 * path resolves themed UI glyphs (those not yet in the lucide name-map) from
 * the right pack, mirroring the old <Icon>'s variant behaviour.
 */
export function setIconVariant(variant?: string): void {
  if (variant) activeIconVariant.value = variant;
}

/** Reactive active icon pack, read by the Icon resolver's fallback path. */
export const iconVariant: ComputedRef<string> = computed(
  () => activeIconVariant.value
);

/**
 * Register icons from a Vite glob import map. Must be called by the consuming
 * app before any Icon renders an asset-backed glyph (flags/providers).
 *
 * @param importMap - import.meta.glob("@icons/⁎⁎/⁎.svg", { query: "?raw", eager: false, import: "default" })
 */
export function registerIcons(importMap: IconImportMap): void {
  iconMap.value = [];
  iconsByName.value = {};

  toPairs(importMap).forEach(([fullPath, loader]) => {
    const filename = last(split(fullPath, /[/\\]/));
    if (!filename || !filename.endsWith(".svg")) return;

    // Remove .svg extension — slice, not trimEnd (which trims a character set)
    const name = filename.slice(0, -4);

    const segments = split(fullPath, /[/\\]/);
    const packsIndex = segments.indexOf("packs");

    // "packs/<variant>/…" → variant; anything else (flags, providers) is root
    const pack =
      packsIndex !== -1 && segments[packsIndex + 1]
        ? segments[packsIndex + 1]
        : undefined;

    const entry: IconEntry = {
      fullPath,
      name,
      pack,
      loader: loader as () => Promise<string>
    };

    iconMap.value.push(entry);

    if (!iconsByName.value[name]) {
      iconsByName.value[name] = [];
    }
    iconsByName.value[name].push(entry);
  });

  isRegistered.value = true;
}

/** Reactive flag indicating if icons have been registered. */
export const hasRegisteredIcons: ComputedRef<boolean> = computed(
  () => isRegistered.value
);

/** Reactive count of registered icons. */
export const getIconCount: ComputedRef<number> = computed(
  () => iconMap.value.length
);

/**
 * Whether a registered asset can serve this name — synchronously, so the
 * resolver can choose the brand's pack over the lucide map without a render
 * pass showing the wrong glyph first. Matches the pack the brand has selected,
 * then root (flags/providers), mirroring `loadIcon`'s own order.
 */
export function hasIcon(name?: string, variant?: string): boolean {
  if (!name) return false;
  const entries = iconsByName.value[name];
  if (isEmpty(entries)) return false;
  const inPack = variant && some(entries, ["pack", variant]);
  return !!inPack || some(entries, entry => isNil(entry.pack));
}

/**
 * Load an SVG icon by name with optional variant (pack) and path matching.
 *
 * @param icon - Icon name as string, or object with `name` and optional `path`
 * @param opts - Loading options (variant/pack, fallback)
 * @returns Raw SVG string if found, undefined otherwise
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

  // Fallback to root icons (no pack) — flags/providers live here
  if (!variant || fallback) {
    const rootMatch = findIcon(safeName, undefined, safePath);
    if (rootMatch) {
      const cacheKey = safePath
        ? `root/${safePath}/${safeName}`
        : `root/${safeName}`;
      return loadAndCache(rootMatch, cacheKey);
    }
  }

  return undefined;
}

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
 * Find an icon matching name + pack + path.
 * Root icons (flags/providers) have an undefined pack; pack icons must match.
 */
const findIcon = (
  name: string,
  pack?: string,
  path?: string
): IconEntry | undefined => {
  const candidates = iconsByName.value[name];

  return find(candidates, entry => {
    if (pack) {
      if (entry.pack !== pack) return false;
    } else {
      if (entry.pack !== undefined) return false;
    }

    if (path) {
      const segments = split(entry.fullPath, /[/\\]/);
      const pathSegments = split(path, /[/\\]/);
      if (!every(pathSegments, seg => includes(segments, seg))) return false;
    }

    return true;
  });
};
