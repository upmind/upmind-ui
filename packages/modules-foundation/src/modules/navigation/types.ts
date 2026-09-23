/**
 * @module foundation/navigation/types
 */
import type { ButtonVariants, LinkVariants } from "@upmind/ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

/**
 * A storefront navigation target, spread straight onto `<Link>`. The `never`
 * fields make the internal/external forms mutually exclusive at type level.
 *
 * Re-homed, not minted. `graphify query "where is StorefrontRoute defined and
 * who consumes it"` over graphify-out/graph.json puts the sole declaration at
 * `packages/client-vue/src/types.ts:20` and its readers across the header,
 * breadcrumbs, system, order, product and session surfaces plus each app's
 * `useStorefrontRoute` — ≥2 domains, no single owner, so it sinks here.
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
