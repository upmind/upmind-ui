// -----------------------------------------------------------------------------
/**
 * @module portal/modules/spec/types
 * @description Prop contract for the `spec` module — labelled term/value rows,
 * over `@upmind/ui`'s `DescriptionList`. Every reference uses this shape:
 * Rockzone's `CLASSES ATTENDED / 18` in the streak card and `INSTRUCTOR / Jon`
 * inside a session card; Assets' `Your plan / Starter`. Distinct from `metric`,
 * which renders headline stat TILES — a row is not a tile.
 */

import type { BadgeVariants } from "@upmind/ui";

export interface SpecModuleItem {
  readonly id: string;
  /** The row's term. No English default (CC22). */
  readonly label: string;
  /** The row's value. */
  readonly value: string;
  /** Navigates when set — the row's value reads as a link (a purchase date to its order). */
  readonly to?: string;
  /**
   * One standing FACT about the row, as a badge after its value — a locked
   * ticket's status, a validated number. A row carries at most one: a spec
   * sheet states facts, and a list of chips is a list, not a value.
   */
  readonly tag?: {
    readonly label: string;
    readonly tone?: BadgeVariants["variant"];
  };
  /** Offers a copy control on this row; selecting it emits `copy:<value>`. */
  readonly copyable?: boolean;
  /**
   * The value is a SECRET: masked until revealed, and copyable whether or not
   * `copyable` is set — a value you cannot read is one you can only copy.
   */
  readonly secret?: boolean;
}

export const SPEC_MODULE_VARIANT = {
  /** Plain sentence-case terms — Assets' "Your plan / Starter". */
  DEFAULT: "default",
  /** Uppercase tracked micro-labels — Rockzone's "CLASSES ATTENDED / 18". */
  MICRO: "micro"
} as const;

export type SpecModuleVariant =
  (typeof SPEC_MODULE_VARIANT)[keyof typeof SPEC_MODULE_VARIANT];

export interface SpecModuleProps {
  readonly items: readonly SpecModuleItem[];
  /** Which term treatment renders; a brand's look is chosen in CONFIG, never baked into the module. */
  readonly variant?: SpecModuleVariant;
  /** Heading shown when `items` is empty. No English default (CC22). */
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
  /** Accessible name for a secret row's reveal control. No English default (CC22). */
  readonly revealLabel?: string;
  /** Accessible name for a row's copy control. No English default (CC22). */
  readonly copyLabel?: string;
  /** Renders at most this many rows behind a Show-all control. Absent = every row. */
  readonly maxItems?: number;
  /** The Show-all control's labels — required wherever `maxItems` is. No English default (CC22). */
  readonly moreLabel?: string;
  readonly lessLabel?: string;
}

export type SpecModuleEmits = {
  select: [value: string];
};
