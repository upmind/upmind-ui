// --- external
import type { rootVariants } from "./link.config";
import type { AvatarProps } from "../avatar";
import type { Icon } from "../icon/types";
import type { CxOptions } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from "vue-router";
// --- internal
// --- types

type LinkVariantProps = VariantProps<typeof rootVariants>;

export type LinkProps = {
  label?: string;
  icon?: string | Icon;
  avatar?: Partial<AvatarProps>;
  iconAppend?: string | Icon;
  avatarAppend?: Partial<AvatarProps>;
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
} & (
  | {
      to: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
      href?: never;
    }
  | { href: string; to?: never }
  | { to?: undefined; href?: undefined }
);

export type LinkItemsProps = {
  color?: LinkProps["color"];
  icon?: LinkProps["icon"];
  avatar?: LinkProps["avatar"];
  size?: LinkProps["size"];
  checked?: boolean;
  loading?: boolean;
  uiConfig?: { link: { items: CxOptions } };
}
