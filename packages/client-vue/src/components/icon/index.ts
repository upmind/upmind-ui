// -----------------------------------------------------------------------------
/**
 * @module components/icon
 * @description The glyph resolver moved down to `@upmind-automation/foundation`
 * in the ADR 023 cut. Re-exported here so this package's own modules keep the
 * import they had; new code reaches for `foundation` directly.
 */

export {
  Icon,
  ICON_MAP,
  FALLBACK_ICON,
  resolveLucideIcon,
  registerIcons,
  loadIcon,
  setIconVariant,
  iconVariant,
  hasRegisteredIcons,
  getIconCount
} from "@upmind-automation/foundation";

export type {
  IconRef,
  IconProps,
  IconSize,
  IconImportMap,
  LoadIconOptions
} from "@upmind-automation/foundation";
