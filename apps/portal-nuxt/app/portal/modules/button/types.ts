// -----------------------------------------------------------------------------
/**
 * @module portal/modules/button/types
 * @description Prop contract for the `button` module (tasks.md 5.4) — the
 * board's single / group / dropdown / split forms, over `@upmind/ui`'s
 * `Button` and `DropdownMenu`.
 */

import type { ButtonVariants } from "@upmind/ui";
import type { Component } from "vue";
// -----------------------------------------------------------------------------

export const BUTTON_MODULE_VARIANT = {
  /** One `Button`. */
  SINGLE: "single",
  /** Several `Button`s in a row, each its own action. */
  GROUP: "group",
  /** One `Button` opening a `DropdownMenu` of actions. */
  DROPDOWN: "dropdown",
  /** A primary `Button` plus an adjacent icon-only trigger opening a `DropdownMenu` of secondary actions. */
  SPLIT: "split"
} as const;

export type ButtonModuleVariant =
  (typeof BUTTON_MODULE_VARIANT)[keyof typeof BUTTON_MODULE_VARIANT];

export type ButtonModuleAction = {
  readonly value: string;
  readonly label: string;
  readonly tone?: ButtonVariants["variant"];
  /**
   * Why this control cannot be used right now. Present = the control is
   * disabled and says so on hover; the reason IS the disabled state, so
   * there is no second flag to keep in step with it.
   */
  readonly disabledReason?: string;
};

export type ButtonModuleProps = {
  /** The registered module variant (registry.ts) — which of the board's four forms renders. */
  readonly variant: ButtonModuleVariant;
  /** The primary control's label — every form but `group` renders it. Ignored by `group`, whose own `actions` each carry a label. No English default (CC22). */
  readonly label: string;
  /** `single` only — the value `select` emits; absent, the label doubles as the value. */
  readonly value?: string;
  /** `single` only — renders the control as a LINK to this path instead of an action (the sidebar's place-order CTA). */
  readonly to?: string;
  readonly tone?: ButtonVariants["variant"];
  /** `single` only — the control's size, the library's own scale. Absent = the library default. */
  readonly size?: ButtonVariants["size"];
  /** `single` only — a leading icon inside the control. */
  readonly icon?: Component;
  /** `single` only — an icon after the label ("View all →"). */
  readonly trailingIcon?: Component;
  /** `single` only — the control fills its container's width (a sidebar CTA). */
  readonly block?: boolean;
  /** `single` only — icon-only control; the label becomes its accessible name. */
  readonly iconOnly?: boolean;
  /** `group`'s own actions; `dropdown`'s menu; `split`'s secondary menu. */
  readonly actions?: readonly ButtonModuleAction[];
  /** `split` only — accessible name for its icon-only secondary trigger. No English default (CC22). */
  readonly moreLabel?: string;
  /** Empty-state heading when `group`/`dropdown` receive no actions. No English default (CC22). */
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
};

export type ButtonModuleEmits = {
  select: [value: string];
};
