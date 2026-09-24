// -----------------------------------------------------------------------------
/**
 * @module foundation/icon
 * @description The shared glyph resolver. UI glyphs resolve to lucide;
 * flags/providers/unmapped names fall back to the registered SVG asset loader.
 *
 * ADR 023 §2's deciding rule puts a presentational primitive in `ui`; `ui` is a
 * submodule outside this cut, so `foundation` is the lowest legal in-tree home.
 */

// --- Component
export { default as Icon } from "./Icon.vue";

// --- Name-map / resolver
export { ICON_MAP, FALLBACK_ICON, resolveLucideIcon } from "./icon-map";

// --- Asset loader (registration is wired by the consuming app)
export {
  registerIcons,
  loadIcon,
  setIconVariant,
  iconVariant,
  hasRegisteredIcons,
  getIconCount
} from "./iconLoader";

// --- Types
export type {
  Icon as IconRef,
  IconProps,
  IconSize,
  IconImportMap,
  LoadIconOptions
} from "./types";
