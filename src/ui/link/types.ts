// --- external
import type { CxOptions } from "class-variance-authority";
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type { Icon } from "../icon/types";
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from "vue-router";

// --- internal
import type { rootVariants } from "./link.config";

// --- types
import type { AvatarProps } from "../avatar";

type LinkVariantProps = VariantProps<typeof rootVariants>;

export interface LinkProps {
  label?: string;
  is?: "router-link" | "a";
  icon?: string | Icon;
  avatar?: Partial<AvatarProps>;
  iconAppend?: string | Icon;
  avatarAppend?: Partial<AvatarProps>;
  // --- link support
  to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
  href?: string;
  // ---
  disabled?: boolean;
  // ---
  focusable?: boolean;
  ring?: "focus" | "focus-visible";
  checked?: boolean;
  color?: LinkVariantProps["color"];
  size?: LinkVariantProps["size"];
  // ---
  uiConfig?: {
    link: { root: CxOptions; label: CxOptions; items: CxOptions };
  };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}

export interface LinkItemsProps {
  color?: LinkProps["color"];
  icon?: LinkProps["icon"];
  avatar?: LinkProps["avatar"];
  size?: LinkProps["size"];
  checked?: boolean;
  loading?: boolean;
}
