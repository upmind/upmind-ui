/**
 * @module foundation/navigation/types
 */
import type { StorefrontRoute } from "../routing";
import type { ButtonVariants, LinkVariants } from "@upmind/ui";

export type BackProps = {
  label?: string;
  icon?: string;
  // Back renders either a Button or a Link, so size must satisfy both scales.
  size?: Extract<LinkVariants["size"], ButtonVariants["size"]>;
  color?: LinkVariants["color"];
  button?: boolean;
} & Partial<StorefrontRoute>;
