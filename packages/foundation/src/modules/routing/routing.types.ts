/**
 * @module foundation/routing
 * @description The funnel/route socket: ADR 023 §7, §8.
 */
import type { RouteLocationAsRelativeGeneric, Router } from "vue-router";

/** A package's flow contribution: given the app's router, register its funnels. */
export type FlowRegistrar = (engine: Router) => void;

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
