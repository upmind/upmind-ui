// --- external
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { IconProps } from "../icon";
import type { avatarVariants } from "./avatar.config";
export type AvatarVariantProps = VariantProps<typeof avatarVariants>;

interface AnimatedIconProps {
  icon: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface AvatarProps {
  src?: string;
  caption?: string;
  icon?: IconProps["icon"];
  animatedIcon?: AnimatedIconProps;
  // ---
  color?: AvatarVariantProps["color"];
  fit?: AvatarVariantProps["fit"];
  size?: AvatarVariantProps["size"];
  shape?: AvatarVariantProps["shape"];
  // ---
  upwindConfig?: { avatar: Partial<AvatarProps> };
  class?: HTMLAttributes["class"];
}
