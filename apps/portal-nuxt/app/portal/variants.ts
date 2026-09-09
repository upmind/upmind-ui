// -----------------------------------------------------------------------------
/**
 * @module portal/variants
 * @description Rhythms and vocabularies shared across the portal layer, so a
 * decision made by more than one component is made ONCE rather than re-picked
 * per file.
 *
 * There are two, not one, and the reason is measurable. What a reader sees is
 * the gap between the WORDS, and each control adds its own padding to that: a
 * nav link pads 12px a side, a button 16px. The reference's topbar runs ~26px
 * between nav labels and ~44px between the account controls — two rhythms,
 * each applied consistently. Reproducing 44px therefore needs a DIFFERENT box
 * gap depending on what sits either side of it, so one shared constant cannot
 * express it:
 *
 *   button ↔ button   16 + 12 + 16 = 44
 *   nav    ↔ button   12 + 16 + 16 = 44
 */

/** Between controls inside ONE module — the buttons of a `group` button module. */
export const CONTROL_CLUSTER_GAP = "gap-3";

/** Between two MODULES sharing a group — a nav beside an account pair. */
export const MODULE_CLUSTER_GAP = "gap-4";

/**
 * How a nav ITEM weights itself against its siblings. The library's
 * `NavigationMenu` trigger style paints every link `text-body` and never reads
 * the `data-active` it already stamps, so a nav reads as a row of equal-weight
 * links. All three references instead mute the inactive items and lift the
 * current one.
 *
 * It lives here, not in the `menu` module, because more than one module renders
 * an item into a chrome bar: `settings` puts a dialog trigger beside the links
 * and has to weigh the same. When the vocabulary lived in `menu` alone, that
 * trigger rendered `text-body` next to muted neighbours.
 */
export const NAV_EMPHASIS = {
  /** The library's own treatment: every item the same weight. */
  PLAIN: "plain",
  /** Inactive items muted, the current one lifted. */
  MUTED: "muted"
} as const;

export type NavEmphasis = (typeof NAV_EMPHASIS)[keyof typeof NAV_EMPHASIS];

const NAV_EMPHASIS_CLASS: Readonly<Record<NavEmphasis, string>> = {
  plain: "",
  // Tokens, never the reference's literal greys — each brand draws its own
  // pair from its own ramp.
  muted: "text-muted hover:text-display data-[active]:text-display"
};

export function navEmphasisClass(emphasis: NavEmphasis | undefined): string {
  return NAV_EMPHASIS_CLASS[emphasis ?? "plain"];
}

/**
 * The portal's quiet empty-state look, shared by every module that renders
 * one (list, empty-state): a bare centered glyph — no tinted well — over
 * small muted text. The library default is a first-run hero; inside a small
 * panel it shouted (operator, 2026-08-26).
 */
export const EMPTY_STATE_UI = {
  // `size-auto mb-1`: the well's fixed 48px box padded the bare glyph with
  // invisible space, reading as a too-large gap to the text.
  icon: "mb-1 size-auto bg-transparent bg-none ring-0 text-muted [&_svg]:size-6",
  title: "text-sm font-medium text-muted",
  description: "text-xs"
} as const;
