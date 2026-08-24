// -----------------------------------------------------------------------------
/**
 * @module components/icon
 * @description client-vue Icon — re-homes the old `@upmind/ui`
 * Icon API surface. UI glyphs resolve to lucide; flags/providers/unmapped names
 * fall back to the registered SVG asset loader. The new lib stays lucide-only.
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
