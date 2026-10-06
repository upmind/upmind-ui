/**
 * @module foundation/navigation/types
 */
import type { ButtonVariants, LinkVariants } from "@upmind/ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

/**
 * A storefront navigation target, spread straight onto `<Link>`. The `never`
 * fields make the internal/external forms mutually exclusive at type level.
 */
export type StorefrontRoute =
  | { to: RouteLocationAsRelativeGeneric; href?: never }
  | { href: string; to?: never };

export type BackProps = {
  label?: string;
  icon?: string;
  // Back renders either a Button or a Link, so size must satisfy both scales.
  size?: Extract<LinkVariants["size"], ButtonVariants["size"]>;
  color?: LinkVariants["color"];
  button?: boolean;
} & Partial<StorefrontRoute>;
