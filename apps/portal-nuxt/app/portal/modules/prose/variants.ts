// -----------------------------------------------------------------------------
/**
 * @module portal/modules/prose/variants
 * @description The `prose` module's own presentation — named classes, one per
 * block, as every other module here keeps them (`document/variants.ts`).
 */

/** The markdown body: the library's own prose rhythm, at the panel's measure. */
export const PROSE_BODY_CLASS =
  "text-sm text-muted-foreground [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:text-foreground";

/** The frames, stacked with the panel's own gap. */
export const PROSE_FRAMES_CLASS = "flex flex-col gap-4";

/** One panel: a titled block over a bordered, rounded frame. */
export const PROSE_FRAME_CLASS = "flex flex-col gap-2";

export const PROSE_FRAME_TITLE_CLASS = "text-sm font-medium text-foreground";

/**
 * The frame itself. A fixed height rather than a ratio: a provider panel is a
 * control surface, not an image, and the scale utilities have no member for
 * "tall enough to use" — this is the same reach `h-96` covers elsewhere.
 */
export const PROSE_FRAME_BODY_CLASS =
  "h-96 w-full rounded-md border border-border bg-background";
