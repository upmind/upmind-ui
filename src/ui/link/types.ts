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
  // --- link support
  to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
  href?: string;
  // ---
  disabled?: boolean;
  // ---
  focusable?: boolean;
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
