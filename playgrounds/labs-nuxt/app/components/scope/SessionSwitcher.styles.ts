import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module components/scope/SessionSwitcher.styles
 * @description CVA configuration for SessionSwitcher.
 *
 * The pool is a menu of labelled groups: staff with their impersonations nested
 * beneath them, direct clients after, the ways in at the foot. Colour is token
 * vocabulary only (`S4`/`AC10.2`), and the active session is marked with the
 * control-selected pair the house already uses for a chosen row — never a
 * hand-written outline (`P7`/`AC1.5`/`ESC2`).
 */

/**
 * A row's own variant, called per row rather than resolved through `useStyles`:
 * which session is active is a property of the ROW, and `useStyles` resolves its
 * variants once against the component's single `meta` object.
 */
export const sessionItem = cva(
  "data-highlighted:bg-button-ghost-hover cursor-pointer gap-2 px-2 py-2",
  {
    variants: {
      isActive: {
        true: "bg-control-selected text-control-selected",
        false: ""
      }
    },
    defaultVariants: { isActive: false }
  }
);

/** The nest's disclosure chevron, pointing down while the nest is open. */
export const nestChevron = cva("transition-transform duration-150", {
  variants: {
    isOpen: { true: "rotate-90", false: "" }
  },
  defaultVariants: { isOpen: false }
});

export default {
  sessionSwitcher: {
    trigger: cva("cursor-pointer"),

    impersonationCue: cva("ml-1"),

    groupLabel: cva(
      "text-muted border-surface border-b text-xs tracking-wider uppercase"
    ),

    group: cva("flex flex-col p-1"),

    identity: cva("flex min-w-0 items-center gap-2"),

    labels: cva("flex min-w-0 flex-col"),

    label: cva("truncate text-sm font-medium"),

    sublabel: cva("text-muted truncate text-xs"),

    // The row's controls never move under a long name: the identity cluster
    // shrinks, this one does not.
    trailing: cva("ml-auto flex shrink-0 items-center gap-1"),

    activeMark: cva("text-success"),

    // The nest reads as belonging to the staff row above it — indented, and
    // hung off one rule rather than boxed.
    nest: cva("border-surface ml-4 border-l pl-1"),

    nestTrigger: cva(
      "text-muted hover:bg-button-ghost-hover flex w-full cursor-pointer items-center gap-1.5 rounded-xs px-2 py-1 text-xs"
    ),

    nestCount: cva("mr-2 ml-auto"),

    actions: cva("bg-canvas border-surface flex flex-col gap-1 border-t p-2"),

    actionsLabel: cva("text-muted text-xs tracking-wider uppercase")
  }
};
