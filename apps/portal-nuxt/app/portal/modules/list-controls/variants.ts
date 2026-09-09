// -----------------------------------------------------------------------------
/**
 * @module portal/modules/list-controls/variants
 * @description The control band's own measurements, named once here rather
 * than spelled into the template (the folder convention: `cva` is a
 * `design-system/packages/ui` dependency, not this app's, so a named constant
 * carries what varies).
 */

/** One instance's row: the controls sit on a line and wrap on a narrow viewport. */
export const CONTROLS_ROW_CLASS = "flex flex-wrap items-center gap-2";

/** The search field: wide enough for a document number and a subject line. */
export const SEARCH_FIELD_CLASS = "w-64";

/** The sort select — one option's words, never a sentence. */
export const SORT_SELECT_CLASS = "w-40";

/** A filter select: narrower than the order, since its trigger reads its own name. */
export const FILTER_SELECT_CLASS = "w-44";

/** One end of a period: a medium date and its calendar glyph. */
export const FILTER_RANGE_CLASS = "w-44";

/** `md` is the segmented rail's own height, so the band reads as one line. */
export const CONTROL_SIZE = "md";
