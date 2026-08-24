import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ScenarioBar.styles
 * @description CVA configuration for ScenarioBar.
 */

export const scenarioBar = {
  // The component is a COLUMN of two rows — the bar, and the scene rail under
  // it (`R7-8`) — so the root carries no chrome of its own: the bar keeps it,
  // and the rail reads as the page's progress beneath rather than as more
  // instrument crammed into the same box.
  root: cva("flex w-full min-w-0 flex-col gap-2"),

  // ONE row that never becomes two: `flex-nowrap` is stated rather than left
  // to the default, because "no wrap and no horizontal scroll" is the claim
  // `AC2.4` reads back — and nothing here opens a sideways scroller, so a
  // playlist that outgrew the row would have to hide, which is what the ONE
  // menu is for (`R7-10`).
  controls: cva(
    "border-surface bg-surface flex w-full min-w-0 flex-nowrap items-center gap-2 rounded-md border p-1"
  ),

  // Bounded and truncated like the menu beside it: a thrown reason can be a
  // paragraph, and the row may neither wrap nor scroll (`AC2.4`) — the whole
  // sentence is the tooltip's.
  failure: cva("max-w-72 min-w-0 truncate"),

  // What the ONE menu frees is where the sheet toggle lives (`G14`).
  tail: cva("ml-auto flex shrink-0 items-center gap-1"),

  // Its own full-width row, indented to the bar's own inner edge so the first
  // stop lines up with the controls above it.
  rail: cva("flex w-full min-w-0 flex-col gap-2 px-1"),

  // Whole, never ellipsised: the row is the page's width, so the scenario the
  // progress belongs to is written out rather than cut to a fragment.
  trackName: cva("text-display m-0 text-sm font-semibold")
};
