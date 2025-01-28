// --- external
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

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
  color?: AvatarVariantProps["color"];
  fit?: AvatarVariantProps["fit"];
  size?: AvatarVariantProps["size"];
  shape?: AvatarVariantProps["shape"];
  variant?: AvatarVariantProps["variant"];
  // ---
  uiConfig?: { avatar: Partial<AvatarProps> };
  class?: HTMLAttributes["class"];
}
