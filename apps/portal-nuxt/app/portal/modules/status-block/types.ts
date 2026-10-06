// -----------------------------------------------------------------------------
/**
 * @module portal/modules/status-block/types
 * @description Prop contract for the `status-block` module (tasks.md 5.3) —
 * a single entity status, over `@upmind/ui`'s `StatusBadge`.
 */

import type { BadgeVariants } from "@upmind/ui";
// -----------------------------------------------------------------------------

export type StatusBlockProps = {
  /** Status text (e.g. "Active", "Renews in 3 days"). No English default (CC22) — the consumer supplies its own copy. */
  readonly label: string;
  /** Semantic intent of the status. */
  readonly tone?: BadgeVariants["variant"];
  /** Visual weight of the badge. */
  readonly appearance?: BadgeVariants["appearance"];
};
