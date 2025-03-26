// --- external
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { rootVariants } from "./link.config";
type LinkVariantProps = VariantProps<typeof rootVariants>;

// --- types
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric,
} from "vue-router";
export interface LinkProps {
  label?: string;
  to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
  href?: string;
  as?: keyof HTMLElementTagNameMap;
  // ---
  disabled?: boolean;
  loading?: boolean;
  // ---
  size?: LinkVariantProps["size"] | string;
  variant?: LinkVariantProps["variant"] | string;
  offset?: LinkVariantProps["offset"] | string;
  color?: LinkVariantProps["color"] | string;
  // ---
  uiConfig?: { link: CxOptions };
}
