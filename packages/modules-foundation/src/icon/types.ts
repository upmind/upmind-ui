// -----------------------------------------------------------------------------
/**
 * @module foundation/icon/types
 * @description Types for the shared glyph resolver.
 */

import type { HTMLAttributes } from "vue";

// --- Icon size scale: monotonic + icon-appropriate (2xs=12px … 3xl=64px) ---
export type IconSize =
  | "auto"
  | "2xs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl";

/** Object form of an icon reference (used by asset SVGs, e.g. flags by path). */
export type Icon = {
  name: string;
  path?: string;
};

export type IconProps = {
  icon: string | Icon;
  /** Icon name tried when `icon` resolves to nothing. */
  fallback?: string | Icon;
  /** Toggles `aria-checked` (preserved for chevron-rotate parity). */
  checked?: boolean;
  /** SVG asset pack/variant — only consulted on the asset-loader fallback path. */
  variant?: string;
  size?: IconSize | string;
  class?: HTMLAttributes["class"];
};

// --- Asset loader types (re-homed from the old iconLoader) ---
export type IconEntry = {
  /** Full resolved path from Vite's import.meta.glob */
  fullPath: string;
  /** Icon name without extension */
  name: string;
  /** Pack/variant name (e.g. "Duocolor", "Line"), undefined for root icons */
  pack?: string;
  /** Lazy loader returning the raw SVG string */
  loader: () => Promise<string>;
};

export type LoadIconOptions = {
  /** Variant pack (e.g. "Duocolor", "Line"). Omitted → loads from root icons. */
  variant?: string;
  /** Fall back to root icons when the variant pack icon is missing. Default true. */
  fallback?: boolean;
};

export type IconImportMap = Record<string, () => Promise<unknown>>;
