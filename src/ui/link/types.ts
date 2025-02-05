// --- external
import type { VariantProps } from "class-variance-authority";

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
  // ---
  disabled?: boolean;
  loading?: boolean;
  // ---
  size?: LinkVariantProps["size"];
  variant?: LinkVariantProps["variant"];
  offset?: LinkVariantProps["offset"];
  color?: LinkVariantProps["color"];
  // ---
  uiConfig?: { link: Partial<LinkProps> };
}
