// -----------------------------------------------------------------------------
/**
 * @module theming/types
 * @description Type definitions for the theming module.
 */

// -----------------------------------------------------------------------------

// graphify-out/graph.json carries no light/dark mode type inside client-vue's
// dependencies — the one neighbour, `ContrastMode` in @upmind-automation/types,
// is an unused per-section contrast setting from a package we do not depend on.
export enum COLOR_MODE {
  LIGHT = "light",
  DARK = "dark"
}
