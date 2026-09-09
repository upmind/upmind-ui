// -----------------------------------------------------------------------------
/**
 * @module portal/modules/timeline/types
 * @description Prop contract for the `timeline` module — a feed of dated
 * events over `@upmind/ui`'s `Timeline`. Legacy drew one per product: the
 * billing automation standing against it, newest first. Distinct from the
 * `list` module's own `timeline` variant, which stacks ROWS on a rail; this
 * one renders EVENTS, whose subject is the date.
 */

import type { TimelineIntent } from "@upmind/ui";

export interface TimelineModuleItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  /**
   * The machine-readable date, which is also what the event reads as. Absent
   * where the fact carries no day — the event still renders, undated.
   */
  readonly datetime?: string;
  /** How the event's marker reads — the library's own intent scale. */
  readonly tone?: TimelineIntent;
  /**
   * Where the event LEADS, where it names something reachable — the invoice a
   * payment is owed on, the control that raises the next one. The title reads
   * as a link when set; the module renders it, it does not decide it.
   */
  readonly to?: string;
}

export interface TimelineModuleProps {
  readonly items: readonly TimelineModuleItem[];
  /** Heading shown when `items` is empty. No English default (CC22). */
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
}
