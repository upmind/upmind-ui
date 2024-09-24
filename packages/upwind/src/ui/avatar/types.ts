// --- external
import { type HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { IconProps } from "../icon";
import type { avatarVariants } from "./avatar.config";
type AvatarVariantProps = VariantProps<typeof avatarVariants>;

export interface AvatarProps {
  src?: string;
  caption?: string;
  icon?: IconProps["icon"];
  // ---
  color?: AvatarVariantProps["color"];
  fit?: AvatarVariantProps["fit"];
  size?: AvatarVariantProps["size"];
  shape?: AvatarVariantProps["shape"];
  // ---
  upwindConfig?: { avatar: Partial<AvatarProps> };
  class?: HTMLAttributes["class"];
}
