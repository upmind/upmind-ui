// -----------------------------------------------------------------------------
/**
 * @module portal/shell/variants
 * @description The one look that genuinely varies by prop in this folder: a
 * Module Group's axis (design.md §D6) as a flex arrangement. `cva` is a
 * `design-system/packages/ui` dependency, not this app's (COMPONENT_SPEC.md
 * § dependencies) — a plain lookup covers one variant dimension without
 * adding one here.
 */

import { MODULE_CLUSTER_GAP } from "../variants";
import { CHROME_LEVEL } from "./types";
import type { ChromeLevel } from "./types";
import type { ContentGutter, ContentMeasure } from "../content/types";
import type { ChromeTone, GroupAxis, TopbarHeight, TopbarSpan } from "../types";

const PORTAL_GROUP_AXIS_CLASS: Readonly<Record<GroupAxis, string>> = {
  // `flex-nowrap`: a horizontal group in a chrome bar must stay on one line —
  // wrapping doubled the topbar's height the moment a nav and an account
  // cluster shared the right region.
  horizontal: `flex flex-row flex-nowrap items-center ${MODULE_CLUSTER_GAP}`,
  vertical: `flex flex-col items-start ${MODULE_CLUSTER_GAP}`,
  // A vertical stack whose members take the group's full width — a card
  // built from a list over a fact sheet. `vertical` shrink-wraps its members
  // (`items-start`), which is right for a button cluster and wrong for rows.
  stacked: `flex flex-col ${MODULE_CLUSTER_GAP}`
};

export function portalGroupClass(axis: GroupAxis): string {
  return PORTAL_GROUP_AXIS_CLASS[axis];
}

/**
 * A chrome bar's tone. `flush` maps to the library's `transparent` tone —
 * no raised surface — plus the 1px rule every reference draws under its bars,
 * which `transparent` alone omits.
 */
export function chromeToneMeta(tone: ChromeTone | undefined) {
  if (tone !== "flush") return { tone: "surface" as const, class: "" };
  // `bg-canvas`, not nothing: the library's `transparent` tone leaves the bar
  // see-through, so page content scrolls up UNDER a sticky header and reads
  // through it. Flush means "the same colour as the page", not "no colour".
  return {
    tone: "transparent" as const,
    class: "bg-canvas border-stroke border-b"
  };
}

/**
 * Constrains a chrome bar's CONTENTS to the same measure the page uses, so the
 * logo lines up with the page title instead of sitting against the viewport
 * edge. Mirrors `@upmind/ui`'s own `pageVariants` — same max-widths, same
 * responsive gutters — because that is the measure it has to match.
 */
const CHROME_MEASURE_CLASS: Readonly<Record<ContentMeasure, string>> = {
  reading: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-7xl",
  full: "max-w-none"
};

/**
 * `CONTENT_GUTTER.OUTSIDE` — the cap grows by both gutters (2rem each at
 * `lg`), so after the same padding the CONTENT hits the measure's own cap:
 * Assets' 1280-wide track at x80 on 1440, where `inside` yields 1216 at x112.
 * Spacing-scale caps (84rem = `max-w-336`), never bracket values.
 */
const OUTER_GUTTER_MEASURE_CLASS: Readonly<Record<ContentMeasure, string>> = {
  reading: "max-w-208",
  default: "max-w-272",
  wide: "max-w-336",
  full: "max-w-none"
};

function measureCapClass(
  measure: ContentMeasure | undefined,
  gutter: ContentGutter | undefined
): string {
  const caps =
    gutter === "outside" ? OUTER_GUTTER_MEASURE_CLASS : CHROME_MEASURE_CLASS;
  return caps[measure ?? "default"];
}

export function chromeMeasureClass(
  measure: ContentMeasure | undefined,
  gutter?: ContentGutter
): string {
  const width = measureCapClass(measure, gutter);
  return `mx-auto flex w-full items-center gap-3 px-4 sm:px-6 lg:px-8 ${width}`;
}

/** The same measure as a BLOCK — `PortalHero`'s inner track, so the hero's title lines up with the page content below it, without the bar arrangement `chromeMeasureClass` adds. */
export function contentMeasureClass(
  measure: ContentMeasure | undefined,
  gutter?: ContentGutter
): string {
  const width = measureCapClass(measure, gutter);
  return `mx-auto w-full px-4 sm:px-6 lg:px-8 ${width}`;
}

/** The `Page`-level binding for `CONTENT_GUTTER.OUTSIDE` — a cap override the pages merge onto `Page`'s own class, since its `width` prop only speaks the `inside` arrangement. Empty for `inside`, so every existing shape renders untouched. */
export function pageTrackClass(
  measure: ContentMeasure | undefined,
  gutter: ContentGutter | undefined
): string {
  if (gutter !== "outside") return "";
  return OUTER_GUTTER_MEASURE_CLASS[measure ?? "default"];
}

/**
 * The topbar's height (`TOPBAR_HEIGHT`) — retunes `Shell`'s own
 * `--shell-header-h` variable, the library's sizing channel (`min-h` and the
 * sticky offsets all read it), so a taller bar moves the chrome below it too.
 * Applied on the `Shell` root; empty for `default`, which keeps the shell's
 * own 56px.
 */
const TOPBAR_HEIGHT_CLASS: Readonly<Record<TopbarHeight, string>> = {
  default: "",
  tall: "[--shell-header-h:calc(var(--spacing)*16)]"
};

export function topbarHeightClass(height: TopbarHeight | undefined): string {
  return TOPBAR_HEIGHT_CLASS[height ?? "default"];
}

/**
 * The topbar's `floating` variant (§D4) — the Assets reference's glass bar.
 * Fixed over the page, so content starts at y=0 and a hero slides underneath;
 * inset from every edge; rounded on the brand's own card radius; translucent
 * over whatever it covers. Named options here, never a brand's own classes —
 * a config only picks the variant.
 *
 * The bar itself goes transparent (`fixed` beats the library's `sticky` in
 * tailwind-merge) and keeps a 14px inset so the box never touches a narrow
 * viewport's edges. How wide the box runs is NOT this variant's decision —
 * the config's `span` (`TOPBAR_SPAN`, types.ts) picks it, resolved by
 * `floatingTopbarInnerClass` below.
 */
export const FLOATING_TOPBAR_BAR_CLASS =
  "fixed inset-x-0 top-0 z-40 border-0 bg-transparent px-3.5 sm:px-3.5";
const FLOATING_TOPBAR_COAT_CLASS =
  "mt-3.5 min-h-16 rounded-card border border-stroke/60 bg-surface/75 shadow-sm backdrop-blur-xl";

/** The floating box, sized by the config's own `span` (`TOPBAR_SPAN`) — the width is a config decision, never this variant's. */
export function floatingTopbarInnerClass(
  span: TopbarSpan | undefined,
  measure: ContentMeasure | undefined,
  gutter: ContentGutter | undefined
): string {
  if (span === "viewport") {
    return `flex w-full items-center gap-3 px-4 ${FLOATING_TOPBAR_COAT_CLASS}`;
  }
  return `${chromeMeasureClass(measure, gutter)} ${FLOATING_TOPBAR_COAT_CLASS}`;
}

/**
 * The shell footer band (gap doc X16): the brand's own note and the platform
 * line beside it, quiet and small — a footer states, it does not compete with
 * the page above it.
 */
/**
 * The signed-in footer's own row. It takes NO padding: the shell's `footer`
 * element already pads (`px-4 py-6 sm:px-6`), and repeating it here made the
 * band 113px tall for two lines of small print.
 */
export const PORTAL_FOOTER_CLASS =
  "flex flex-col items-center gap-2 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-start";

/** The platform's line — no colour, no size: the footer it sits in sets both. */
export const PORTAL_UPMIND_MARK_CLASS =
  "inline-flex shrink-0 items-center gap-1.5";

export const PORTAL_FOOTER_PROSE_CLASS = "[&_p]:m-0 [&_a]:underline";

/**
 * The logged-out column (plan F11) — the library's own `AuthShell` supplies
 * the stage, its header/footer rows and the centred track; this is what stacks
 * inside it: the brand's note for the screen, then the card the page renders
 * in.
 */
export const LOGGED_OUT_COLUMN_CLASS = "flex flex-col gap-4";

/** The brand's own note above the screen — quieter than the form under it. */
export const LOGGED_OUT_NOTE_CLASS =
  "text-muted text-sm [&_p]:m-0 [&_a]:underline";

/** The page inside the card brings `Page`'s own padding; a second one boxes it in. */
export const LOGGED_OUT_CARD_CONTENT_CLASS = "p-0";


/**
 * The chrome grid. `@upmind/ui`'s own `Shell` panel declares three rows and
 * two columns; the portal stacks three bars and an off-canvas pane, so it
 * declares its own tracks — one per bar, the content, the footer, and the
 * pane column. Every extra track is `auto`, so a shell composing one bar and
 * no pane lays out exactly as the library's own grid does.
 *
 * Important, because `Shell` concatenates `ui.panel` after its own classes
 * without a merge: both `grid-rows-[…]` utilities stay on the element and the
 * stylesheet's order picks the library's. Under that template the empty
 * second row takes the `1fr` and a short page sinks to the foot of the
 * viewport.
 */
export const CHROME_PANEL_CLASS =
  "grid-rows-[auto_auto_auto_minmax(0,1fr)_auto]! lg:grid-cols-[auto_minmax(0,1fr)_auto]!";

/** The two track heights the sub-bars and the bottom strip read, on the Shell root beside its own `--shell-header-h`. */
export const CHROME_TRACK_CLASS =
  "[--shell-subbar-h:calc(var(--spacing)*11)] [--shell-bottom-h:calc(var(--spacing)*14)]";

/**
 * A bar's own track and its sticky anchor. The topbar pins at the viewport
 * top; a sub-bar pins at the running total of the chrome ABOVE it, which the
 * bar itself declares as `--shell-sticky-offset` (`chromeStickyOffset`) — a
 * fixed `top-N` would collapse the two sub-bars onto one another.
 */
const CHROME_LEVEL_CLASS: Readonly<Record<ChromeLevel, string>> = {
  [CHROME_LEVEL.PRIMARY]: "row-start-1 min-h-(--shell-header-h) top-0",
  [CHROME_LEVEL.SECONDARY]:
    "row-start-2 min-h-(--shell-subbar-h) top-(--shell-sticky-offset)",
  [CHROME_LEVEL.TERTIARY]:
    "row-start-3 min-h-(--shell-subbar-h) top-(--shell-sticky-offset)"
};

export function chromeLevelClass(level: ChromeLevel): string {
  return CHROME_LEVEL_CLASS[level];
}

/**
 * The running total of the chrome above one bar, as the custom property the
 * bar's own `top` reads. Distinct per level by construction: a bar with two
 * bars above it clears both, and removing the bar BELOW it changes nothing.
 */
export function chromeStickyOffset(
  hasTopbar: boolean,
  subBarsAbove: number
): Readonly<Record<string, string>> {
  let base = "0px";
  if (hasTopbar) base = "var(--shell-header-h)";
  if (subBarsAbove === 0) return { "--shell-sticky-offset": base };
  return {
    "--shell-sticky-offset": `calc(${base} + ${subBarsAbove} * var(--shell-subbar-h))`
  };
}

/** The content and footer tracks, moved down past the two sub-bar rows. */
export const CHROME_MAIN_CLASS = "row-start-4";
export const CHROME_FOOTER_CLASS = "row-start-5";

/** The sidebar column spans every row of the taller grid. */
export const CHROME_SIDEBAR_CLASS = "row-span-5 row-start-1";

/**
 * The utility pane's desktop column — the grid's third track, an exact mirror
 * of the sidebar's first. `hidden lg:flex` is the CSS guard the pre-hydration
 * render needs; below `lg` the pane's own drawer branch renders instead.
 */
export const ACTION_PANE_COLUMN_CLASS =
  "col-start-3 row-span-5 row-start-1 hidden min-h-0 w-(--shell-pane-w) flex-col border-s border-stroke bg-surface lg:flex lg:sticky lg:top-0 lg:h-dvh lg:max-h-dvh lg:self-start [--shell-pane-w:20rem]";

/** The pane's own box inside the drawer — the column branch gets its box from the grid. */
export const ACTION_PANE_DRAWER_CLASS = "flex min-h-0 flex-1 flex-col";

/** The rail's collapse trigger: `lg+` only — below it the topbar's own trigger opens the drawer. */
export const SIDEBAR_TRIGGER_CLASS = "ms-auto hidden lg:inline-flex";

/** The pane's inner arrangement — a scrolling stack over a pinned foot, in both branches. */
export const ACTION_PANE_BODY_CLASS =
  "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4";
export const ACTION_PANE_FOOT_CLASS = "flex flex-col gap-4 p-4";

/**
 * Viewport-fixed bottom chrome, outside the panel's flow: a bar hidden at
 * `lg` must reserve no track there, and a contained panel cannot host
 * viewport-spanning chrome. The strip takes no pointer events and hands them
 * to its occupant, so the band swallows no clicks where the bar is hidden.
 */
export const CHROME_BOTTOM_CLASS =
  "pointer-events-none fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] [&>*]:pointer-events-auto";

/** What the page clears below `lg` so the fixed bar never covers its last row. */
export const CHROME_BOTTOM_INSET_CLASS = "pb-(--shell-bottom-h) lg:pb-0";
