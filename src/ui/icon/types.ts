// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { iconVariants } from "./icon.config";
type IconVariantProps = VariantProps<typeof iconVariants>;

export interface Icon {
  name: string;
  path: string;
}

// --- types
export interface IconProps {
  icon: string | Icon;
  fallback?: string | Icon;
  checked?: boolean;
  variant?: string;
  // ---
  size?: IconVariantProps["size"] | string;
  // ---
  uiConfig?: { icon: CxOptions };
  class?: HTMLAttributes["class"];
}

export type IconEntry = {
  /** Full resolved path from Vite's import.meta.glob */
  fullPath: string;
  /** Icon name without extension */
  name: string;
  /** Pack/variant name (e.g. "Duocolor", "Line"), undefined for root icons */
  pack?: string;
  /** Lazy loader function that returns the raw SVG string */
  loader: () => Promise<string>;
};

export type LoadIconOptions = {
  /** Variant pack (e.g. "Duocolor", "Line"). If omitted, loads from root icons. */
  variant?: string;
  /** Whether to fall back to root icons when the variant pack icon is missing. Defaults to true. */
  fallback?: boolean;
};

export type IconImportMap = Record<string, () => Promise<unknown>>;
