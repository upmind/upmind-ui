// -----------------------------------------------------------------------------
/**
 * @module portal/modules/menu/types
 * @description Prop contract for the `menu` module (tasks.md 2.7).
 */

import type { NavEmphasis } from "../../variants";
import type { Component } from "vue";

export type MenuItem = {
  /** The destination, path plus pinned query ("/products?type=sub"). ABSENT = a non-navigating group label above its children (the products rail's "Browse by category"). */
  readonly to?: string;
  /** An EXTERNAL destination — a brand's own storefront, which leaves the portal. Wins over `to`; never active. */
  readonly href?: string;
  readonly label: string;
  readonly icon: Component;
  /**
   * Child destinations (tasks.md 3.4) — an item with children is a group, read
   * only by the sidebar's `nested` variant (`shell/PortalFrame.vue`), which
   * drives `@upmind/ui`'s `SidebarNav` directly from this same item shape. The
   * flat `menu` module (this file's own component) never reads it.
   */
  readonly children?: readonly MenuItem[];
};

export const MENU_VARIANT = {
  DEFAULT: "default",
  HORIZONTAL: "horizontal"
} as const;

export type MenuVariant = (typeof MENU_VARIANT)[keyof typeof MENU_VARIANT];

export interface MenuProps {
  /** Config-owned route list (design.md §D5) — never hardcoded in the component, so a later config renders its own labels (tasks.md Task 6). */
  readonly items: readonly MenuItem[];
  /** The sidebar rail's collapsed state, threaded by `PortalSlotContent` from `ShellSidebar`'s own slot scope — never read via `injectShellContext`, which reports the RAIL and is wrong for a mobile drawer (tasks.md 2.7). */
  readonly collapsed?: boolean;
  /**
   * `default` (tasks.md 2.7) renders `SidebarNavRoot`/`SidebarNavLink`, a
   * vertical rail. `horizontal` (tasks.md 5's own board note — a sub-bar
   * filled with the vertical rail overlaps its 44px track) renders
   * `@upmind/ui`'s `NavigationMenu` instead. `dropdown`/`mega` stay
   * unimplemented (registry.ts).
   */
  readonly variant?: MenuVariant;
  /**
   * Accessible name of the `<nav>` landmark this menu renders — the one
   * `NavigationMenu` emits for `horizontal`, and the rail's own for
   * `default`. No English default (CC22) — the consumer supplies its own
   * copy. It cannot be left to `ShellSidebar`'s landmark
   * (PortalFrame's `sidebarLabel`): that only exists where the menu sits in
   * the shell sidebar, and an `inline` utility pane renders into the page's
   * aside instead.
   */
  readonly navLabel?: string;
  /** `horizontal` only — which item weighting renders (portal/variants.ts). */
  readonly emphasis?: NavEmphasis;
}
