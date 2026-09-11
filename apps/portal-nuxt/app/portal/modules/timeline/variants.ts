// -----------------------------------------------------------------------------
/**
 * @module portal/modules/timeline/variants
 * @description The `timeline` module's own presentation — one named class,
 * for the title that leads somewhere. `cva` is a
 * `design-system/packages/ui` dependency, not this app's
 * (COMPONENT_SPEC.md § dependencies), so a single lookup covers the one
 * dimension, exactly as `document/variants.ts` does.
 */

/** A dated event whose title is reachable reads as a link, and only on hover. */
export const TIMELINE_LINK_CLASS =
  "hover:text-primary underline-offset-4 hover:underline";

/** The inline action after an event's description — a gap from the sentence it follows. */
export const TIMELINE_ACTION_CLASS = "ms-1";
