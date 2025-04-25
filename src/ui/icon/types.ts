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
  // ---
  size?: IconVariantProps["size"] | string;
  // ---
  uiConfig?: { icon: CxOptions };
  class?: HTMLAttributes["class"];
}
