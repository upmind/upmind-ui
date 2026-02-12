import type { rootVariants } from "./banner.config";
import type { Icon } from "../icon/types";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

type BannerVariantProps = VariantProps<typeof rootVariants>;

export interface BannerProps {
  /** The text content of the banner */
  text?: string;
  /** An optional icon for the action area */
  icon?: string | Icon;
  // ---
  variant?: BannerVariantProps["variant"];
  color?: BannerVariantProps["color"];
  // ---
  uiConfig?: { banner: CxOptions };
  class?: HTMLAttributes["class"];
}
