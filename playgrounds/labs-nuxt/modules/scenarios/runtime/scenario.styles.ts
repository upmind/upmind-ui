// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/scenario.styles
 * @description Centralized ring class constants for the scenario playground.
 *
 * The @upmind/ui package does not yet export ring utilities (the old lib's
 * `useHighlightRing` / `invalidRingClasses` have no new-lib equivalent). This
 * file centralizes the ring constants so the playground uses ONE source rather
 * than scattering literals across styles files (ESC2).
 *
 * When the ui package adds ring utilities, update this file to re-export them
 * and remove the local definitions.
 */

// -----------------------------------------------------------------------------

/**
 * The highlight ring for forced/deliberate mode — primary color, offset for
 * visibility at page scale. Never warning (H2): forcing is a mode the developer
 * chose, not a fault the page is reporting.
 */
export const highlightRingClasses =
  "outline outline-[2px] outline-primary/50 outline-offset-8!";

/**
 * The invalid ring for failed records — primary color, no offset (the element
 * itself is the error boundary). Matches the ui field's own invalid treatment.
 */
export const invalidRingClasses = "outline outline-[2px] outline-primary/50";
