// -----------------------------------------------------------------------------
/**
 * @module foundation/icon
 * @description The shared glyph resolver.
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
