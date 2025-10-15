// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { AnimatedIconProps } from "../icon-animated/types";
import type { IconProps } from "../icon/types";
import type { avatarVariants } from "./avatar.config";
export type AvatarVariantProps = VariantProps<typeof avatarVariants>;

export interface AvatarProps {
  src?: string;
  caption?: string;
  icon?: IconProps["icon"];
  animatedIcon?: AnimatedIconProps;
  // ---
  focusable?: boolean;
  // ---
  color?: AvatarVariantProps["color"];
  fit?: AvatarVariantProps["fit"];
  shape?: AvatarVariantProps["shape"];
  size?: AvatarVariantProps["size"];
  // ---
  uiConfig?: { avatar: CxOptions };
  class?: HTMLAttributes["class"];
}
