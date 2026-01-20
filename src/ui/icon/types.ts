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
  /** Lazy loader function that returns the raw SVG string */
  loader: () => Promise<string>;
};

export type LoadIconOptions = {
  /** Variant folder (e.g. "Duocolor", "Line"). If omitted, falls back to Global. */
  variant?: string;
  /** Whether to fall back to Global when the variant icon is missing. Defaults to true. */
  fallback?: boolean;
};
