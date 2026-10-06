// -----------------------------------------------------------------------------
/**
 * @module portal/content/surface
 * @description The provide/inject channel naming the ground a row PAINTS, for
 * the modules inside it.
 *
 * A module that paints a soft fill of its own — the banner's `Alert` — has to
 * know whether anything is painted behind it. On the page ground the two land
 * within two points of each other (`rgb(247,249,255)` on `rgb(249,249,252)`),
 * so the notice reads as a smudge rather than a message.
 */

import { computed, inject, provide } from "vue";
import { ROW_SURFACE } from "./types";
import type { RowSurface } from "./types";
import type { ComputedRef, InjectionKey } from "vue";
// -----------------------------------------------------------------------------

export const ROW_SURFACE_KEY: InjectionKey<
  ComputedRef<RowSurface | undefined>
> = Symbol("portal-row-surface");

/** Called by the row's own surface (`PortalSection`). */
export function provideRowSurface(
  surface: ComputedRef<RowSurface | undefined>
): void {
  provide(ROW_SURFACE_KEY, surface);
}

/** Absent provider — a bare row, or a unit mount — reads as the page ground. */
export function injectRowSurface(): ComputedRef<RowSurface | undefined> {
  return inject(
    ROW_SURFACE_KEY,
    computed(() => undefined)
  );
}

/**
 * Does the row paint a ground of its own? `section` is the ghost card — a
 * heading with no chrome — so it leaves the page ground showing, as a bare row
 * does.
 */
export function hasPaintedSurface(surface: RowSurface | undefined): boolean {
  if (surface === undefined) return false;
  return surface !== ROW_SURFACE.SECTION;
}
