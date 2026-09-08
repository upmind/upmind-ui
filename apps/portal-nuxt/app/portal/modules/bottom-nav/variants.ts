// -----------------------------------------------------------------------------
/**
 * @module portal/modules/bottom-nav/variants
 * @description The bottom strip's look. `@upmind/ui` ships no `BottomNav` on
 * this submodule branch, so the bar is the portal's own — these are the
 * library bar's own classes, kept so the strip renders exactly as it did.
 *
 * `lg:hidden` and no bare `hidden`: the bar occupies its track only below the
 * chrome breakpoint, where the sidebar's primary nav is off-canvas. The strip
 * that hosts it is viewport-fixed (`shell/variants.ts`), so a hidden bar
 * reserves nothing at desktop.
 */

export const BOTTOM_NAV_CLASS =
  "h-(--shell-bottom-h) border-t border-stroke bg-surface lg:hidden";

export const BOTTOM_NAV_LIST_CLASS = "flex h-full items-stretch";

/** Every destination takes an equal share of the track and truncates rather than wrapping. */
export const BOTTOM_NAV_CELL_CLASS = "flex min-w-0 flex-1";

/** The glyph above the label — sized here, never by the icon component. */
export const BOTTOM_NAV_ICON_CLASS = "size-4 shrink-0";

/** A long destination name truncates inside its share rather than widening it. */
export const BOTTOM_NAV_LABEL_CLASS = "max-w-full truncate";

const BOTTOM_NAV_ITEM_CLASS = [
  "flex h-full w-full min-w-0 flex-col items-center justify-center gap-1 px-1 text-xs transition",
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40"
].join(" ");

const BOTTOM_NAV_ITEM_RESTING_CLASS =
  "text-muted hover:bg-mist active:bg-(--bg-button-ghost-active)";

const BOTTOM_NAV_ITEM_ACTIVE_CLASS =
  "font-medium bg-primary-muted text-primary-muted-contrast hover:bg-primary-muted-delta active:bg-primary-muted-active";

export function bottomNavItemClass(active: boolean): string {
  if (active) return `${BOTTOM_NAV_ITEM_CLASS} ${BOTTOM_NAV_ITEM_ACTIVE_CLASS}`;
  return `${BOTTOM_NAV_ITEM_CLASS} ${BOTTOM_NAV_ITEM_RESTING_CLASS}`;
}
