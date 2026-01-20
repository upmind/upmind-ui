// ---------------------------------------------------------------
// iconLoader.ts – on‑demand SVG loader with in‑memory cache & fallback logic
// ---------------------------------------------------------------

/**
 * Lazy‑import map for all SVGs under the @icons alias.
 * Each entry returns a Promise<string> containing the raw SVG text.
 */
import {
  toPairs,
  get,
  set,
  isObject,
  split,
  last,
  endsWith,
  includes,
  every,
  find
} from "lodash-es";

// Vite glob that creates a lazy‑import map for every SVG.
const importMap = import.meta.glob("@icons/**/*.svg", {
  query: "?raw",
  eager: false,
  import: "default"
}) as Record<string, () => Promise<string>>;

console.log(
  "import.meta.glob found:",
  Object.keys(importMap).length,
  "SVG files"
);

/** Simple in‑memory cache – lives for the page lifetime */
const cache: Record<string, string> = {};

/**
 * Store icon with full path for flexible string matching.
 */
interface IconEntry {
  fullPath: string; // Full resolved path from Vite
  name: string; // Icon name without extension
  loader: () => Promise<string>;
}

const iconMap: IconEntry[] = [];

toPairs(importMap).forEach(([fullPath, loader]) => {
  // Extract filename and remove .svg extension
  const filename = fullPath.split(/[/\\]/).pop();
  if (!filename || !filename.endsWith(".svg")) return;

  const name = filename.slice(0, -4); // Remove ".svg"

  iconMap.push({
    fullPath,
    name,
    loader: loader as () => Promise<string>
  });
});

/**
 * Options for loading an icon.
 */
export interface LoadIconOptions {
  /** Variant folder (e.g. "Duocolor", "Line"). If omitted we treat it as global. */
  variant?: string;
  /** Whether to fall back to the global folder when the variant icon is missing. */
  fallback?: boolean;
}

/**
 * Load an icon using endsWith/contains matching like the original logic.
 */
export async function loadIcon(
  icon: string | { name: string; path?: string },
  opts: LoadIconOptions
): Promise<string | undefined> {
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
      return await loadAndCache(variantMatch, cacheKey);
    }
  }

  // Fallback to Global
  if (!variant || fallback) {
    const globalMatch = findIcon(safeName, "Global", safePath);
    if (globalMatch) {
      const cacheKey = safePath
        ? `Global/${safePath}/${safeName}`
        : `Global/${safeName}`;
      return await loadAndCache(globalMatch, cacheKey);
    }
  }

  console.warn("Icon not found in @icons", { variant, safeName, safePath });
  return undefined;
}

/**
 * Helper to load and cache an icon
 * @param entry
 * @param cacheKey
 * @returns
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

/*
Helper to find icon matching all provided criteria
*
**/
const findIcon = (name: string, variant?: string, path?: string) =>
  find(iconMap, entry => {
    // Split path into segments
    const segments = split(entry.fullPath, /[/\\]/);

    // 1. Name must match (last segment should be {name}.svg)
    const filename = last(segments);
    if (filename !== `${name}.svg`) return false;

    // 2. Variant must match (if provided) - check if variant exists in segments
    if (variant && !includes(segments, variant)) return false;

    // 3. Path must match (if provided) - all path segments must exist in entry segments
    if (path) {
      const pathSegments = split(path, /[/\\]/);
      const allPathsMatch = every(pathSegments, seg => includes(segments, seg));
      if (!allPathsMatch) return false;
    }

    return true;
  });
