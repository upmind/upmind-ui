// -----------------------------------------------------------------------------
/**
 * @module portal/modules/form/variants
 * @description The `form` module's look. `cva` is a
 * `design-system/packages/ui` dependency, not this app's — a plain lookup
 * covers what varies here (mirrors `shell/variants.ts`).
 */

export const FORM_MODULE_CLASS = "flex flex-col gap-4";

/** The heading block above the fields — quieter than a row header, which may already name the panel. */
export const FORM_HEADING_CLASS = "flex flex-col gap-1";
export const FORM_TITLE_CLASS = "text-display text-sm font-medium";
export const FORM_DESCRIPTION_CLASS = "text-muted text-sm";
