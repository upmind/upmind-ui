import type { iconVariants } from "./iconAnimated.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

type IconVariantProps = VariantProps<typeof iconVariants>;

export interface AnimatedIconProps {
  icon: string;
  trigger?: string;
  sequence?: string;
  delay?: number;
  // ---
  size?: IconVariantProps["size"] | string;
  // ---
  uiConfig?: { iconAnimated: CxOptions };
  class?: HTMLAttributes["class"];
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * The type for the import map returned by import.meta.glob for animations.
 * Flexible to accept Vite's actual return type.
 */
export type AnimationImportMap = Record<string, () => Promise<unknown>>;

/**
 * Animation entry storing parsed metadata for efficient matching.
 */
export interface AnimationEntry {
  /** Full resolved path from Vite's import.meta.glob */
  fullPath: string;
  /** Animation name without extension */
  name: string;
  /** Lazy loader function that returns the animation URL */
  loader: () => Promise<string>;
}
