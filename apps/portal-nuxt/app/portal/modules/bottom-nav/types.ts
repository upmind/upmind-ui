// -----------------------------------------------------------------------------
/**
 * @module portal/modules/bottom-nav/types
 * @description Prop contract for the `bottom-nav` module (tasks.md 3.3).
 */

import type { Component } from "vue";
// -----------------------------------------------------------------------------

export type BottomNavModuleItem = {
  readonly to: string;
  readonly label: string;
  readonly icon: Component;
};

export type BottomNavModuleProps = {
  /**
   * Config-owned destinations (design.md §D5) — a curated 3-5, never a reflow
   * of the sidebar's menu (tasks.md 3.3). Never hardcoded here, so a later
   * config renders its own labels.
   */
  readonly items: readonly BottomNavModuleItem[];
  /** Accessible name of the wrapped `<nav>` landmark. No English default (CC22) — the consumer names their own portal's navigation. */
  readonly label: string;
};
