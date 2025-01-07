// --- external
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { iconVariants } from "./icon.config";
type IconVariantProps = VariantProps<typeof iconVariants>;

interface Icon {
  name: string;
  path: string;
}

// --- types
export interface IconProps {
  icon: string | Icon;
  // ---
  size?: IconVariantProps["size"];
  // ---
  upwindConfig?: { icon: Partial<IconProps> };
  class?: HTMLAttributes["class"];
}
