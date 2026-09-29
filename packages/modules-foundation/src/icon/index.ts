// -----------------------------------------------------------------------------
/**
 * @module foundation/icon
 * @description The shared glyph resolver.
 */

// --- Component
export { default as Icon } from "./Icon.vue";

// --- Asset loader (registration is wired by the consuming app)
export { registerIcons, setIconVariant, iconVariant } from "./iconLoader";

// --- Types
export type { Icon as IconRef, IconProps, IconImportMap } from "./types";
