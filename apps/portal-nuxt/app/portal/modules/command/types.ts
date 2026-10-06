// -----------------------------------------------------------------------------
/**
 * @module portal/modules/command/types
 * @description Prop contract for the `command` module — the app shell's ⌘K
 * launcher, over `@upmind/ui`'s `CommandDialog`. Items are config-authored,
 * like `account-menu`'s: each emits its `value` through the action seam, so a
 * destination rides the `navigate:` verb.
 */

export type CommandModuleItem = {
  readonly value: string;
  readonly label: string;
  /** The keycap hint beside the row ("⌘I"). Absent renders none. */
  readonly shortcut?: string;
};

export type CommandModuleProps = {
  /** The trigger's own copy, and the palette's accessible name. No English default (CC22). */
  readonly label: string;
  /** Visually hidden dialog title — the palette's accessible name for a screen reader. */
  readonly title: string;
  readonly placeholder: string;
  /** The no-matches line. */
  readonly emptyLabel: string;
  /** Heading above the rows. Absent renders an unheaded run. */
  readonly heading?: string;
  readonly items: readonly CommandModuleItem[];
};

export type CommandModuleEmits = {
  select: [value: string];
};
