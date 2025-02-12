// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { AnimatedIconProps } from "../icon-animated";
import type { IconProps } from "../icon";
import type { avatarVariants } from "./avatar.config";
export type AvatarVariantProps = VariantProps<typeof avatarVariants>;

export interface AvatarProps {
  src?: string;
  caption?: string;
  icon?: IconProps["icon"];
  animatedIcon?: AnimatedIconProps | string;
  // ---
  focusable?: boolean;
  // ---
  color?: AvatarVariantProps["color"] | string;
  fit?: AvatarVariantProps["fit"] | string;
  size?: AvatarVariantProps["size"] | string;
  shape?: AvatarVariantProps["shape"] | string;
  variant?: AvatarVariantProps["variant"] | string;
  // ---
  uiConfig?: { avatar: CxOptions };
  class?: HTMLAttributes["class"];
}
