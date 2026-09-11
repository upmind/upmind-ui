// -----------------------------------------------------------------------------
/**
 * @module portal/modules/tabs/types
 * @description Prop contract for the `tabs` module (tasks.md 5.1), over
 * `@upmind/ui`'s `Tabs`. Carries the board's `pills`, `underlined` and
 * `segmented` variants (`Tabs`'s own vocabulary spells the middle one
 * `underline` — design.md §D4's labels-are-semantic caveat) and a vertical
 * orientation on pills.
 */

import type { TabsProps } from "@upmind/ui";

export interface TabsModuleTab {
  readonly value: string;
  readonly label: string;
  /**
   * Rendered inside this tab's own panel. Absent makes the tabs a RAIL: the
   * content it switches lives below it in the row, not inside it — legacy's
   * status tabs over one results list.
   */
  readonly content?: string;
  /**
   * The action value this tab emits when picked, riding the same `select`
   * seam every other module's actions use. A rail's tabs carry a `navigate:`
   * value, so the status lands in the route's query and the URL stays
   * shareable — legacy's tabs were distinct routes.
   */
  readonly action?: string;
}

export interface TabsModuleProps {
  readonly tabs: readonly TabsModuleTab[];
  readonly variant?: TabsProps["variant"];
  /** Only meaningful with `variant: "pills"` (tasks.md 5.1). */
  readonly orientation?: TabsProps["orientation"];
  /** The tab currently showing — a rail reads it from the route, so a reload keeps the tab. */
  readonly selected?: string;
  /** Empty-state heading when `tabs` is empty (tasks.md 5.6). No English default (CC22). */
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
}

export type TabsModuleEmits = {
  /** The picked tab's action value — the seam every module's actions ride. */
  select: [value: string];
};
