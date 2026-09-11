// -----------------------------------------------------------------------------
/**
 * @module portal/content/types
 * @description The content primitive's config contract (design.md §D7,
 * tasks.md 4.1-4.4) and `PortalRow`'s own prop/slot contract.
 */

import type { DataRef } from "../mock/data-refs";
import type { DataRouteContext } from "../mock/injection";
import type {
  ResolvedContentRow,
  ResolvedRowHeader,
  ResolvedSlot
} from "../resolve";
import type { PageKey, SlotAssignment, UtilitySide } from "../types";
import type { HTMLAttributes, VNode } from "vue";

/**
 * The board's row-layout tokens (design.md §D7), verbatim. The board's
 * diagram shows the tokens naming SLOT proportions, not the row itself — an
 * asymmetric row is a `row-2-1` slot beside a `row-1-2` slot, an equal row is
 * two `row-1-1` slots — but because those pairings are always fixed (an
 * asymmetric row's wide side is always paired with the narrow token, never
 * two wide tokens), naming the ROW by its first slot's token loses nothing
 * and is what `PortalRow`'s own `layout` prop below does.
 *
 * `row-1-1-1` is not on the board (§D7: "Not read: the three-column layout's
 * slot tokens"). Chosen here by extending the pattern the four known tokens
 * establish — each token's own share is its first number, the rest are its
 * row-mates' shares in order — the same way `row-1-1` (two equal shares)
 * extends to three.
 */
export const ROW_LAYOUT = {
  FULL: "row-full",
  SPLIT_EQUAL: "row-1-1",
  SPLIT_WIDE_LEFT: "row-2-1",
  SPLIT_WIDE_RIGHT: "row-1-2",
  TRIPLE_EQUAL: "row-1-1-1"
} as const;

export type RowLayout = (typeof ROW_LAYOUT)[keyof typeof ROW_LAYOUT];

/** Only meaningful for `ROW_LAYOUT.FULL` — the board's three single-slot rows (Full Width / Single Column / Centre Narrow) differ only by measure and bleed, which collapses to one `PortalRow` variant taking this (§D7). */
export const ROW_MEASURE = {
  BLEED: "bleed",
  PAGE: "page",
  READING: "reading"
} as const;

export type RowMeasure = (typeof ROW_MEASURE)[keyof typeof ROW_MEASURE];

/**
 * How a row presents itself AROUND its slots. Every one of the three
 * reference portals repeats the same three shapes: a titled block with no
 * chrome ("My Sessions", "Recent orders", "Saved Classes"), a bordered panel,
 * and a panel whose header carries the brand (Rockzone's "Recent Progress").
 * Absent = a bare row, the same "absence is empty" rule slots follow (F5).
 */
export const ROW_SURFACE = {
  SECTION: "section",
  PANEL: "panel",
  /** A grey FILLED panel, no border — Host·Grid's setup panel and Strata's "Recent Assets" both draw this, not the bordered white card. */
  MUTED: "muted",
  BRAND: "brand",
  /** A dark card on the light canvas — the Assets board's `card.cta` ("Upgrade & save"). A local dark-token island, like the hero. */
  INVERSE: "inverse"
} as const;

export type RowSurface = (typeof ROW_SURFACE)[keyof typeof ROW_SURFACE];

/**
 * The full-measure control band under a panel's description: what REFINES the
 * list, as opposed to `actions`, which sits beside the title and acts on the
 * panel. Two positions, laid out apart on one line — a search field reads left,
 * the filters and the order read right — because a band is a row of controls,
 * not a stack, and a vertical module group shrink-wraps its members.
 */
export type RowHeaderControls = {
  readonly start?: SlotAssignment;
  readonly end?: SlotAssignment;
};

/**
 * A row's own heading. `actions` is a `SlotAssignment` like any slot, so the
 * trailing controls every reference puts beside a section title ("Browse",
 * "View all", "All progress") are ordinary modules, not a second vocabulary.
 */
export type RowHeaderConfig = {
  readonly title: string;
  readonly description?: string;
  readonly actions?: SlotAssignment;
  /** The band beneath the description — absent renders no band at all. */
  readonly controls?: RowHeaderControls;
};

/** One row of the content config's ordered list (tasks.md 4.2). `slots` is unused by any page today (Task 5's modules do not exist yet) — the shape stands ready for them, the same way Task 2 typed `topbar` before any module could occupy it. */
export type ContentRowConfig = {
  readonly layout: RowLayout;
  readonly measure?: RowMeasure;
  readonly surface?: RowSurface;
  readonly header?: RowHeaderConfig;
  /** The row's trailing region — a pager, a summary line. A module like any other. */
  readonly footer?: SlotAssignment;
  /**
   * A data ref answering whether this row belongs on the page at all — a
   * credit-limit panel with no limit to meter, a child-accounts panel for an
   * account with no children. A panel's own heading renders whatever its list
   * holds, so an empty list cannot express "this section does not apply".
   * Absent renders the row unconditionally.
   */
  readonly visible?: DataRef;
  /**
   * The row's own fragment id — what a `#anchor` link on this page lands on
   * (the affiliate stats' balance tiles point at the lists that explain
   * them). Absent renders no id at all.
   */
  readonly anchor?: string;
  readonly slots: readonly SlotAssignment[];
};

/** Matches `@upmind/ui`'s `PageVariants["width"]` verbatim — the content config's own measure drives `Page`'s `width` (tasks.md 4.4), a whole-page setting distinct from a `row-full` row's own `measure` above. */
export const CONTENT_MEASURE = {
  READING: "reading",
  DEFAULT: "default",
  WIDE: "wide",
  FULL: "full"
} as const;

export type ContentMeasure =
  (typeof CONTENT_MEASURE)[keyof typeof CONTENT_MEASURE];

/** `PageBody`'s aside track width — a fixed track beside a fluid main. */
export const CONTENT_ASIDE_SIZE = {
  SM: "sm",
  MD: "md",
  LG: "lg"
} as const;

export type ContentAsideSize =
  (typeof CONTENT_ASIDE_SIZE)[keyof typeof CONTENT_ASIDE_SIZE];

/**
 * Where the page gutters sit relative to the measure's cap. The references
 * split, measured at 1440: Rockzone runs `inside` — a 1280 track with the
 * gutters padded INTO it, content at x112 — while Assets runs `outside` —
 * the cap applies to the CONTENT, gutters beyond it, content at x80.
 * `inside` is the library `Page`'s own arrangement and the default.
 */
export const CONTENT_GUTTER = {
  INSIDE: "inside",
  OUTSIDE: "outside"
} as const;

export type ContentGutter =
  (typeof CONTENT_GUTTER)[keyof typeof CONTENT_GUTTER];

/**
 * A full-bleed page hero — the Assets reference's photographic band. The
 * page's own `title`/`description` render ON it (light ink over a scrim, so
 * an arbitrary photograph stays legible), a breadcrumb trail above them and
 * trailing controls beside. A floating topbar overlays its top edge. Any
 * shape can declare one; absent, pages render the plain `PageHeader` exactly
 * as before.
 */
export type ContentHeroConfig = {
  /** Backdrop image URL. Absent paints the scrim alone — the stand-in until the brand supplies its photograph. */
  readonly image?: string;
  /** The trail above the title — a module (breadcrumbs) like any slot. */
  readonly breadcrumb?: SlotAssignment;
  /** Trailing controls on the band's right edge. */
  readonly actions?: SlotAssignment;
};

export type ContentConfig = {
  readonly measure?: ContentMeasure;
  /** Gutter arrangement for the measure above — chrome bars, hero and page all follow it. Absent = `inside`. */
  readonly gutter?: ContentGutter;
  /**
   * A PAGE-LEVEL aside running beside every row — the reference portals' right
   * pane (Rockzone's identity/streak column). Distinct from the `utility`
   * PRIMITIVE, which is the shell's full-height action rail: the rail starts
   * above the topbar and narrows the chrome to its left, while this track sits
   * INSIDE the page, under full-width chrome, which is what the references
   * actually draw.
   *
   * Rows, not bare slots — the reference's pane is a plain identity block, a
   * brand-headed card and a plain next-session block, which is exactly the
   * `surface`/`header`/`footer` vocabulary a content row already carries.
   * Absent = no aside, `PageBody`'s own default.
   */
  readonly aside?: readonly ContentRowConfig[];
  readonly asideSize?: ContentAsideSize;
  /** Which side the aside track sits on. Absent = `right`; an `inline` utility pane supplies its own (types.ts `UtilityConfig.side`). */
  readonly asideSide?: UtilitySide;
  /** Rules the aside off from the main column. Rockzone draws one; a shape that wants a clean split does not. */
  readonly asideDivider?: boolean;
  /**
   * The shape's own page identity (tasks.md 6.0) — read by every page's
   * `<PageTitle>`. `ContentConfig` carries no route dimension (design.md
   * §D7, `OPEN-DECISION.md`), so this is ONE title per shape, the same on
   * every route — coarser than a per-route heading, not a fake one.
   */
  readonly title?: string;
  /** The line under the page title — Rockzone's "Here's the latest with your account and progress". */
  readonly description?: string;
  /** The trail above a PLAIN page header's title — Host·Grid's "Home". A hero shape's trail lives on the hero instead. */
  readonly breadcrumb?: SlotAssignment;
  /** Declared, the title/description above render on this band instead of the plain `PageHeader`. */
  readonly hero?: ContentHeroConfig;
  readonly rows?: readonly ContentRowConfig[];
  /**
   * Renders `PageFooter` when `true` (tasks.md 4.3). A presence flag, not a
   * `SlotAssignment` — `PageFooter`'s own content ("meta, secondary actions",
   * `PageFooter.vue`) is page-authored, the same as a `PortalRow`'s slot
   * content, rather than a module-resolved region.
   */
  readonly footer?: boolean;
};

export interface PortalRowProps {
  layout: RowLayout;
  /** Only read when `layout` is `ROW_LAYOUT.FULL` — every other layout ignores it. */
  measure?: RowMeasure;
  class?: HTMLAttributes["class"];
}

export interface PortalRowSlots {
  /** `row-full` — the row's only content. */
  default?: () => VNode[];
  /** `row-1-1` / `row-1-1-1` — the first (equal) slot. */
  start?: () => VNode[];
  /** `row-1-1-1` only — the middle (equal) slot. */
  middle?: () => VNode[];
  /** `row-1-1` — the second (equal) slot. `row-1-1-1`'s own third slot. */
  end?: () => VNode[];
  /** `row-2-1` / `row-1-2` — the wide column (two parts of the row's proportional grid). */
  main?: () => VNode[];
  /** `row-2-1` / `row-1-2` — the narrow column (one part of the row's proportional grid). */
  aside?: () => VNode[];
}

/**
 * Which of `PortalRowSlots`' named slots each `ContentRowConfig.slots`
 * array index fills, in order (Task 5's AC5.1 wiring — `resolve.ts`'s
 * `ResolvedContentRow` carries the same ordered array). `row-full` fills the
 * default slot; the split layouts follow `PortalRow.vue`'s own
 * `STATIC_ROW_META` wide/narrow ordering.
 */
export const ROW_SLOT_NAMES: Readonly<
  Record<RowLayout, readonly (keyof PortalRowSlots)[]>
> = {
  [ROW_LAYOUT.FULL]: ["default"],
  [ROW_LAYOUT.SPLIT_EQUAL]: ["start", "end"],
  [ROW_LAYOUT.SPLIT_WIDE_LEFT]: ["main", "aside"],
  [ROW_LAYOUT.SPLIT_WIDE_RIGHT]: ["aside", "main"],
  [ROW_LAYOUT.TRIPLE_EQUAL]: ["start", "middle", "end"]
};

export interface PortalSectionProps {
  /** Absent renders the row bare — no wrapper, exactly as before this existed. */
  readonly surface?: RowSurface;
  readonly header?: ResolvedRowHeader;
  readonly footer?: ResolvedSlot;
  /** The row's fragment id, where its config declared one. */
  readonly anchor?: string;
}

/**
 * The thin page host every route renders (`PortalPageHost.vue`) — the one
 * place `resolve()` meets a page. Pages differ only by these props.
 */
export interface PortalPageHostProps {
  /** Candidate content keys, most-specific first (`resolve.ts` `PortalRoute.pageKeys`). Absent = the singular `content` fallback. */
  readonly pageKeys?: readonly PageKey[];
  /** Route-aware title override (the catch-all's group/area label). Absent = the resolved content's own `title`. */
  readonly heading?: string;
  /** The route position the data-ref selectors may key off (mock/injection.ts) — the catch-all supplies it. */
  readonly routeContext?: DataRouteContext;
  /** Accessible name for the page-level aside landmark — required by `PortalContent`. */
  readonly asideLabel: string;
}

export interface PortalContentProps {
  /** The resolved row list (`resolve()`'s own `ResolvedContent.rows`) — `PortalContent` renders exactly this, one container per row, in the configured order (AC5.1). */
  readonly rows: readonly ResolvedContentRow[];
  /** The page-level aside's resolved rows; empty renders no aside track at all. */
  readonly aside?: readonly ResolvedContentRow[];
  readonly asideSize?: ContentAsideSize;
  readonly asideDivider?: boolean;
  /** Which side the aside track sits on (types.ts `UtilityConfig.side`). Absent = `right`. */
  readonly asideSide?: UtilitySide;
  /** Accessible name for the aside landmark — required by `PageAside`. No English default (CC22). */
  readonly asideLabel: string;
}
