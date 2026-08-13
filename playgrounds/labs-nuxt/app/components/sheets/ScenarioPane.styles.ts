import { cva } from "class-variance-authority";
import { STEP_STATE } from "./ScenarioPane.types";
import { fenceBlock } from "./sheets.styles";
// -----------------------------------------------------------------------------
/**
 * @module sheets/ScenarioPane.styles
 * @description CVA configuration for ScenarioPane.
 *
 * The playlist reads as a step list rather than a rendered blob: a fixed glyph
 * gutter, the kind, then the step, so the eye tracks one column while the player
 * moves down it.
 */

export default {
  scenarioPane: {
    root: cva("flex flex-col gap-6"),

    section: cva("flex flex-col gap-2"),

    title: cva("text-display m-0 text-sm font-bold"),

    // The declaration is disclosed, not dumped: its trigger sits on the panel's
    // own left edge like a section heading rather than reading as a button in a
    // row of buttons (`R6-21`).
    disclosure: cva(
      "text-muted hover:text-display -ml-2.5 cursor-pointer text-xs font-semibold tracking-wider uppercase"
    ),

    // Capped and scrolled: a whole declaration file is over a thousand pixels
    // tall, and uncapped it pushes the feature — the half carrying the live
    // playhead — off the panel entirely (`AC3.4`).
    fence: cva([fenceBlock(), "max-h-64 overflow-y-auto text-xs"]),

    empty: cva("text-muted m-0 text-sm"),

    playlist: cva("flex flex-col gap-4"),

    track: cva("flex flex-col gap-1"),

    trackHeader: cva("flex flex-wrap items-center gap-2"),

    steps: cva("m-0 flex list-none flex-col p-0 text-sm"),

    stepIcon: cva("block shrink-0"),

    // The kind is the gutter every step shares, so the sentences start on one
    // column instead of at three different offsets.
    stepKind: cva("text-muted w-12 shrink-0 text-xs font-semibold"),

    stepText: cva("min-w-0 text-left")
  }
};

/**
 * One stop's own row, called per stop rather than resolved through `useStyles`:
 * the state is a property of the ROW, and `useStyles` resolves its variants once
 * against the component's single `meta` object.
 *
 * A stop LOOKS interactive — pointer, hover, focus ring — because it is one: a
 * step is a seek target, not a marker (`R6-22`). `w-full` and the left-aligned
 * text are what make a `<button>` sit in a list like a row.
 *
 * The current stop is the primary family, the same one every playing treatment
 * wears (`H2`), carrying the WEIGHT as well as the tint — a playhead nobody can
 * find is not a playhead. A played stop is quiet but legible, and one not reached
 * yet is muted: three states, readable apart at a glance (`R6-24`).
 */
export const stepRow = cva(
  "flex w-full cursor-pointer items-baseline gap-2 border-l-2 px-2 py-1 text-left transition-colors",
  {
    variants: {
      state: {
        [STEP_STATE.CURRENT]:
          "bg-accent-primary-muted text-accent-primary-muted-contrast border-accent-primary font-semibold",
        [STEP_STATE.DONE]:
          "text-display hover:bg-accent-neutral/10 border-transparent",
        [STEP_STATE.PENDING]:
          "text-muted hover:bg-accent-neutral/10 border-transparent"
      }
    },
    defaultVariants: { state: STEP_STATE.PENDING }
  }
);
