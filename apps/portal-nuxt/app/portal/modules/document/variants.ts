// -----------------------------------------------------------------------------
/**
 * @module portal/modules/document/variants
 * @description The `document` module's own presentation — the two looks a
 * billing document has (on screen, on paper) and the named classes its blocks
 * wear. `cva` is a `design-system/packages/ui` dependency, not this app's
 * (COMPONENT_SPEC.md § dependencies), so one lookup per dimension covers it,
 * exactly as `list/variants.ts` and `spec/variants.ts` do.
 */

import { DOCUMENT_MODULE_VARIANT } from "./types";
import type { DocumentActionVariant, DocumentModuleVariant } from "./types";
import type { ButtonVariants } from "@upmind/ui";
// -----------------------------------------------------------------------------

/**
 * The document's own frame. On paper it takes the page's full measure on
 * white and drops the screen's hover affordances; on screen it simply flows
 * inside whatever panel hosts it.
 */
const DOCUMENT_ROOT_CLASS: Readonly<Record<DocumentModuleVariant, string>> = {
  [DOCUMENT_MODULE_VARIANT.DEFAULT]: "flex flex-col gap-6",
  [DOCUMENT_MODULE_VARIANT.PRINT]:
    "flex flex-col gap-6 bg-white text-black print:gap-4"
};

export function documentRootClass(
  variant: DocumentModuleVariant | undefined
): string {
  return DOCUMENT_ROOT_CLASS[variant ?? DOCUMENT_MODULE_VARIANT.DEFAULT];
}

/** The header band: the document's identity left, its controls right, stacking on a narrow screen. */
export const DOCUMENT_HEADER_CLASS =
  "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between";

/** The number and its badge sit on one line, the badge riding the baseline. */
export const DOCUMENT_TITLE_ROW_CLASS = "flex items-center gap-2";

/** The controls cluster — wraps rather than overflowing a narrow header. */
export const DOCUMENT_ACTIONS_CLASS = "flex flex-wrap items-center gap-2";

/** The two party blocks run side by side from `sm` and stack below it. */
export const DOCUMENT_PARTY_CLASS = "grid gap-6 sm:grid-cols-2";

/** One party block's own stack — its label, then its lines. */
export const DOCUMENT_PARTY_BLOCK_CLASS = "flex flex-col gap-1";

/** A party's label is the quiet ledger caption above the name. */
export const DOCUMENT_PARTY_LABEL_CLASS =
  "text-muted text-xs tracking-wide uppercase";

/** Address lines and identifiers read as data, not prose. */
export const DOCUMENT_PARTY_LINE_CLASS = "text-muted text-sm";

/** The totals block sits under the lines table, on its right, at a readable column width. */
export const DOCUMENT_TOTALS_CLASS = "sm:ms-auto sm:w-80";

/**
 * The settled stamp over the totals — legacy inked it across the amount-due
 * block at an angle, in the success tone, big enough to read at a glance and
 * quiet enough not to obscure the figures under it.
 */
export const DOCUMENT_PAID_STAMP_CLASS =
  "text-success/70 pointer-events-none absolute inset-0 flex -rotate-12 items-center justify-center text-3xl font-bold tracking-widest uppercase";

/** The totals block is the stamp's positioning context. */
export const DOCUMENT_TOTALS_STAMP_WRAP_CLASS = "relative";

/**
 * The footer well under the totals — legacy inked it as a small inline block
 * at a readable minimum measure, quieter than the figures above it.
 */
export const DOCUMENT_DETAILS_CLASS =
  "bg-muted/40 text-muted min-w-64 rounded-md p-3 text-xs sm:w-fit";

/** The messages stack above the document, one under another. */
export const DOCUMENT_MESSAGES_CLASS = "flex flex-col gap-2";

/** The dates row under the number — a compact inline spec sheet. */
export const DOCUMENT_DATES_CLASS = "flex flex-wrap gap-x-6 gap-y-1";

export const DOCUMENT_DATE_LABEL_CLASS = "text-muted text-xs";

/** Which library button weight each document action wears. */
const DOCUMENT_ACTION_TONE: Readonly<
  Record<DocumentActionVariant, ButtonVariants["variant"]>
> = {
  primary: "primary",
  outline: "outline",
  ghost: "ghost"
};

export function documentActionTone(
  variant: DocumentActionVariant | undefined
): ButtonVariants["variant"] {
  return DOCUMENT_ACTION_TONE[variant ?? "outline"];
}
