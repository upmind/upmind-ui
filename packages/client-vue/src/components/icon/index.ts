// -----------------------------------------------------------------------------
/**
 * @module components/icon
 * @description Re-exports the glyph resolver from `@upmind-automation/foundation`.
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
