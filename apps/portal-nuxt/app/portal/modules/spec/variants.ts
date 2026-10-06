// -----------------------------------------------------------------------------
/**
 * @module portal/modules/spec/variants
 * @description The `spec` module's term treatment — the one look that varies
 * by prop here. Uppercase micro-labels are one brand's choice (Rockzone), not
 * the module's only voice, so they live behind a variant rather than in the
 * component's own classes.
 */

import type { SpecModuleVariant } from "./types";
// -----------------------------------------------------------------------------

const SPEC_TERM_CLASS: Readonly<Record<SpecModuleVariant, string>> = {
  default: "",
  micro: "text-muted text-xs tracking-wide uppercase"
};

export function specTermClass(variant: SpecModuleVariant | undefined): string {
  return SPEC_TERM_CLASS[variant ?? "default"];
}

/** A masked secret reads as a fixed run of bullets — never the value's own length, which leaks it. */
export const SPEC_SECRET_MASK = "••••••••";

/** A revealed secret is a value to read exactly, so it wears the tabular face amounts and ids do. */
export const SPEC_VALUE_CLASS = "type-data";

/** The row's trailing control cluster — reveal, copy. */
export const SPEC_CONTROLS_CLASS = "flex items-center gap-1";

/** The module's own frame — the rows, and the Show-all control under them. */
export const SPEC_ROOT_CLASS = "flex flex-col";

/** The Show-all control, under the rows it uncovers. */
export const SPEC_MORE_CLASS = "mt-1 self-start";
