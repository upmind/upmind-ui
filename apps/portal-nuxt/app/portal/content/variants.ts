// -----------------------------------------------------------------------------
/**
 * @module portal/content/variants
 * @description `row-full`'s measure lookup (design.md §D7) — the one look
 * that varies by prop in this folder. `cva` is a `design-system/packages/ui`
 * dependency, not this app's (COMPONENT_SPEC.md § dependencies) — a plain
 * lookup covers one variant dimension without adding one here (mirrors
 * `shell/variants.ts`'s `portalGroupClass`).
 */

import { MODULE_CLUSTER_GAP } from "../variants";
import type { RowMeasure, RowSurface } from "./types";

/**
 * The `controls` band under a panel's description (`RowHeaderControls`): ONE
 * line, its two positions laid apart, wrapping on a narrow viewport — nothing
 * sticky, nothing clever. The gap is the rhythm two modules sharing a row
 * already keep. Only a bottom margin: every surface's header already pads
 * itself below the description, and the body it opens does not.
 *
 * A module group inside the band wraps: the shared horizontal axis is
 * `flex-nowrap` for the chrome bars (shell/variants.ts), and a control band
 * on a narrow viewport has to break its filters onto new lines instead.
 */
export const ROW_CONTROLS_BAND_CLASS = `mb-6 flex flex-wrap items-center justify-between ${MODULE_CLUSTER_GAP} [&_[data-slot=portal-module-group]]:flex-wrap`;

const ROW_FULL_MEASURE_CLASS: Readonly<Record<RowMeasure, string>> = {
  // Cancels Page's own `px-4 sm:px-6 lg:px-8` (design-system/packages/ui/src/components/page/variants.ts)
  // so the row reaches the container's edges rather than the viewport's.
  bleed: "-mx-4 sm:-mx-6 lg:-mx-8",
  page: "",
  // Matches Page's own `reading` width literal (`max-w-3xl`) so a narrowed
  // row reads at the same measure the page-level width option would give it.
  reading: "mx-auto w-full max-w-3xl"
};

export function rowFullMeasureClass(measure: RowMeasure): string {
  return ROW_FULL_MEASURE_CLASS[measure];
}

/** `row-1-1` — `PageBody`'s aside track is fixed-width, never equal (design.md §D7), so `PortalRow` supplies its own equal grid. */
export const ROW_SPLIT_EQUAL_CLASS = "grid items-start gap-6 lg:grid-cols-2";

/** `row-2-1` / `row-1-2` — a proportion (two parts to one), not a fixed track beside a fluid one; `PageBody`'s aside is the latter, so `PortalRow` supplies its own 3-column grid with the wide slot spanning two (design.md §D7, corrected 2026-08-24). */
export const ROW_SPLIT_ASIDE_CLASS = "grid items-start gap-6 lg:grid-cols-3";

/** The wide slot of `row-2-1` / `row-1-2`, alongside the narrow slot's implicit single column. */
export const ROW_SPLIT_ASIDE_WIDE_CLASS = "lg:col-span-2";

/** `row-1-1-1` (Three Column Left) — same reasoning as the equal split, extended to three columns. */
export const ROW_TRIPLE_EQUAL_CLASS = "grid items-start gap-6 lg:grid-cols-3";

/**
 * A row surface's own look (`ROW_SURFACE`), keyed part by part. The library's
 * card parts each carry their own `p-6`, so a `section` cancels it with `p-0`
 * — tailwind-merge keeps the later class. Read from the three references:
 * `section` is a bare titled block, `panel` a bordered card, `brand` a panel
 * whose header strip carries the shape's own colour.
 */
type RowSurfaceClasses = {
  readonly root: string;
  readonly header: string;
  readonly title: string;
  readonly body: string;
  /** The body when the row has NO header — `body`'s `pt-0` assumes one above it, and clips a headerless card otherwise. */
  readonly bodyBare: string;
  /**
   * `empty:hidden` on every surface: a footer's SLOT is assigned in config,
   * but whether its module renders is runtime data — a pager on a collection
   * that fits one page renders nothing, and `Card`'s `hasFooter` reads slot
   * presence, so the bordered, padded region stood around a comment node.
   * The region collapses when its content renders nothing, the same rule a
   * bare row and an empty list already follow.
   */
  readonly footer: string;
};

const ROW_SURFACE_CLASS: Readonly<Record<RowSurface, RowSurfaceClasses>> = {
  // Every padding here repeats itself at `lg:`. The card parts carry `p-6`
  // and `Card` adds `cardPaddingVariants` (`p-6 lg:p-12`) on top, and a BASE
  // utility never overrides a RESPONSIVE one in tailwind-merge — so a bare
  // `p-0` left 48px of padding standing at lg, which read as ~100px of dead
  // air between every section heading and its content.
  section: {
    root: "",
    header: "p-0 pb-4 lg:p-0 lg:pb-4",
    title: "text-lg",
    body: "p-0 lg:p-0",
    bodyBare: "p-0 lg:p-0",
    footer: "p-0 pt-4 lg:p-0 lg:pt-4 empty:hidden"
  },
  panel: {
    root: "",
    // Full p-6 below the header — a pb-4 tightener put the content 16px
    // under the description, which read as cramped (operator, 2026-08-26).
    header: "p-6 lg:p-6",
    title: "",
    body: "p-6 pt-0 lg:p-6 lg:pt-0",
    bodyBare: "p-6 lg:p-6",
    footer: "border-stroke border-t p-6 lg:p-6 empty:hidden"
  },
  muted: {
    root: "bg-neutral-muted border-transparent",
    header: "p-6 pb-4 lg:p-6 lg:pb-4",
    title: "",
    body: "p-6 pt-0 lg:p-6 lg:pt-0",
    bodyBare: "p-6 lg:p-6",
    footer: "p-6 pt-0 lg:p-6 lg:pt-0 empty:hidden"
  },
  brand: {
    // The header strip runs to the card's own edge, so the root must clip it.
    root: "overflow-hidden",
    header:
      "bg-primary-muted text-primary-muted-contrast border-stroke border-b p-6 lg:p-6",
    title: "text-primary-muted-contrast",
    body: "p-6 lg:p-6",
    bodyBare: "p-6 lg:p-6",
    footer: "border-stroke border-t p-6 lg:p-6 empty:hidden"
  },
  inverse: {
    // `dark`: the card is a local dark-token island (like the hero), so its
    // ink and surface come from the token system's own dark values.
    root: "dark bg-surface overflow-hidden border-transparent",
    header: "p-6 pb-4 lg:p-6 lg:pb-4",
    title: "",
    body: "p-6 pt-0 lg:p-6 lg:pt-0",
    bodyBare: "p-6 lg:p-6",
    footer: "p-6 pt-0 lg:p-6 lg:pt-0 empty:hidden"
  }
};

export function rowSurfaceClasses(surface: RowSurface): RowSurfaceClasses {
  return ROW_SURFACE_CLASS[surface];
}

/** `section` carries no chrome of its own; the other two are real cards. */
export function rowSurfaceCardVariant(
  surface: RowSurface
): "ghost" | "default" {
  if (surface === "section") return "ghost";
  return "default";
}

/**
 * The page's trailing band — meta and secondary actions below the last row.
 * A plain block, never a `<footer>`: the shell owns the document's single
 * contentinfo landmark, and a page inside it would raise a second.
 * `@upmind/ui`'s `page` family ships no footer part on this submodule branch,
 * so the band is the portal's own (ui-gaps.md).
 */
export const PAGE_FOOTER_CLASS = "mt-6 flex flex-wrap items-center gap-3";
