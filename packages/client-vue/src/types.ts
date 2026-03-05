// -----------------------------------------------------------------------------
/**
 * @module client-vue/types
 * @description Shared types for the client-vue package.
 */

import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

/**
 * Discriminated union for storefront navigation targets.
 *
 * Components receive this as a prop and spread it onto `<Link>`:
 * - Internal route: `{ to: { name: 'catalogue' } }`
 * - External URL:   `{ href: 'https://shop.example.com' }`
 *
 * The `never` fields ensure mutual exclusivity at the type level.
 */
export type StorefrontRoute =
  | { to: RouteLocationAsRelativeGeneric; href?: never }
  | { href: string; to?: never };
