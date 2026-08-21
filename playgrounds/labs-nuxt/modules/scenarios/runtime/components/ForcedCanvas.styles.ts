import { cva } from "class-variance-authority";
import { useHighlightRing } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ForcedCanvas.styles
 * @description CVA configuration for ForcedCanvas.
 *
 * The treatment is an OUTLINE around the whole page and NOTHING else (`R6-18`):
 * no padding, no border, no background — an outline reserves no space, so
 * arming a preset cannot move a single column, and the same technique family
 * already marks a refused record (`H10`). The 1px inset ring this replaces was
 * invisible at page scale, and the padding and muted fill beside it were the
 * geometry change the ruling banned.
 *
 * Primary, never warning (`H2`): forcing is a mode the developer chose, not a
 * fault the page is reporting. So the frame takes the ui's HIGHLIGHT ring rather
 * than its invalid one, applied rather than re-spelt, exactly as a refused row
 * takes the invalid one (`ESC2`) — one outline vocabulary in the product, owned
 * by the package, with the deliberate-mode and the fault families as its two
 * members.
 */

/**
 * The ui highlight ring's own treatment, standing further off the page than a
 * component-scale surface needs it to (`R7-7`).
 *
 * The OFFSET is the one thing a page-sized frame has to say for itself: at the
 * package's own four the outline hugs the content it rings, which reads as a
 * border on the page rather than a glow around it — and an offset is the only
 * knob that buys that distance without costing the page a pixel of geometry
 * (`R6-18` holds). It is marked important because `useHighlightRing` composes
 * by concatenation rather than merge — both offsets reach the class list, and
 * which one wins would otherwise be a question about stylesheet order. The
 * package's own ring vocabulary overrides itself the same way
 * (`invalidRingClasses`).
 */
const highlightRing = useHighlightRing("outline-offset-8!");

export default {
  forcedCanvas: {
    root: cva("flex flex-col gap-3 transition-all duration-200", {
      variants: {
        isForced: {
          true: `card-radius ${highlightRing}`,
          false: ""
        }
      },
      defaultVariants: { isForced: false }
    }),

    // On the frame's own top edge, opposite the controls that start every other
    // row of the page — the chip answers "what am I looking at", so it reads
    // with the frame rather than joining the queue of things to click.
    header: cva("flex items-center gap-2 self-end"),

    hint: cva("text-muted text-xs")
  }
};
