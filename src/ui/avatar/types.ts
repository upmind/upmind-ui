import type { IconProps } from "../icon";
import type { AnimatedIconProps } from "../icon-animated";
import type { avatarVariants } from "./avatar.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

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
