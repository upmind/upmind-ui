// -----------------------------------------------------------------------------
/**
 * @module portal/modules/composer/variants
 * @description The `composer` module's look. `cva` is a
 * `design-system/packages/ui` dependency, not this app's — a plain lookup
 * covers what varies here (mirrors `modules/form/variants.ts`).
 */

export const COMPOSER_MODULE_CLASS = "flex flex-col gap-2";

/** The row under the field — the file names on the left, the controls on the right. */
export const COMPOSER_CONTROLS_CLASS =
  "flex flex-wrap items-center justify-between gap-2";

/** The attachments field takes the row's spare width, down to a legible floor. */
export const COMPOSER_ATTACHMENTS_CLASS = "min-w-48 flex-1";

/** The two controls at the end of that row. */
export const COMPOSER_ACTIONS_CLASS = "flex items-center gap-2";
