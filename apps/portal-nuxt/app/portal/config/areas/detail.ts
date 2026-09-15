// -----------------------------------------------------------------------------
/**
 * @module portal/config/areas/detail
 * @description The area override a DETAIL route takes — a page about one
 * product or one ticket. `routes.ts`'s `isDetailRoute` decides which routes
 * this reaches; this file carries only the override's own content, replacing
 * the base config's `utility` primitive wholesale (design.md §D8 — never a
 * deep merge).
 *
 * It removes the pane rather than restating it. The pillar rail navigates the
 * SECTION, so on a page about one entity it offers siblings the reader did not
 * ask for, and it holds a side track open that narrows the page for nothing.
 * The way back is a link above the title (the page's `breadcrumb` slot), which
 * is the one destination a detail page actually owes its reader.
 */

import { PRIMITIVE_ID } from "../../types";
import type { AreaOverride } from "../../types";

export const DETAIL_AREA_OVERRIDE: AreaOverride = {
  [PRIMITIVE_ID.UTILITY]: false
};
