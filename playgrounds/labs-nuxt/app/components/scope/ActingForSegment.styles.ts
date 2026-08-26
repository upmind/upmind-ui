import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module components/scope/ActingForSegment.styles
 * @description CVA configuration for ActingForSegment.
 *
 * The panel marks its current row the way the session pool marks the active
 * session (`SessionSwitcher.styles`): the control-selected pair plus a check in
 * the trailing cluster. One marking vocabulary across the scope bar, so a row
 * that looks chosen IS the row the trigger names (`R6-12`).
 */

/**
 * A row's own variant, called per row rather than resolved through `useStyles`:
 * which actor is current is a property of the ROW, and `useStyles` resolves its
 * variants once against the component's single `meta` object.
 */
export const actorRow = cva("", {
  variants: {
    isCurrent: {
      true: "bg-control-selected text-control-selected",
      false: ""
    }
  },
  defaultVariants: { isCurrent: false }
});

export default {
  actingFor: {
    // Acting for nobody IS acting as SELF, and self is 99% of every session
    // (`R6-3`/`R6-3b`) — so the resting segment recedes, and only a context the
    // user picked wears the selected pair the pool marks an active session with.
    trigger: cva("", {
      variants: {
        isActing: {
          true: "bg-control-selected text-control-selected",
          false: "text-muted"
        }
      },
      defaultVariants: { isActing: false }
    }),

    // The row's own trailing cluster, on the pool's law: the label shrinks
    // under a long name, what marks the row does not.
    trailing: cva("ml-auto flex shrink-0 items-center gap-2"),

    // What a row RESOLVES TO is a tag, and a tag may never read as a choice —
    // the pill it used to wear looked exactly like an active state (`R6-12`).
    // Drawn as the ui Combobox draws its own item tags: quiet trailing text.
    tag: cva("text-muted text-xs leading-none text-nowrap"),

    mark: cva("text-success"),

    // The id fallback closes the panel, under the rows it is the last resort for.
    idField: cva("border-control-default border-t p-2")
  }
};
