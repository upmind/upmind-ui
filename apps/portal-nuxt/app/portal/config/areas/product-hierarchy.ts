// -----------------------------------------------------------------------------
/**
 * @module portal/config/areas/product-hierarchy
 * @description The area override design.md §D8 quotes verbatim from the
 * board — "Nested area in dashboard → lose primary navigation links →
 * Sidebar for quick categories" — exercised on real routes (tasks.md 6.4).
 * `routes.ts`'s `isNestedProductArea` decides WHICH routes this reaches (any
 * path beneath a configured product group); this file carries only the
 * override's own content, replacing the base config's `sidebar` primitive
 * wholesale (§D8 — never a deep merge).
 *
 * The board's fourth clause — a secondary bar for filters — carried a hand-drawn
 * All / Active / Renewing rail that no legacy screen ever showed, so the bar and
 * its tabs are gone: a product page filters nothing at this level.
 */

import { CreditCard, LifeBuoy } from "lucide-vue-next";
import { MENU_MODULE_ID, moduleRef } from "../../registry";
import { PRIMITIVE_ID } from "../../types";
import type { MenuItem } from "../../modules/menu/types";
import type { AreaOverride } from "../../types";
// -----------------------------------------------------------------------------

/** Quick jumps for a page already inside one product — not the six-item primary nav the base sidebar carries. */
const QUICK_CATEGORY_ITEMS: readonly MenuItem[] = [
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/support", label: "Support", icon: LifeBuoy }
];

export const PRODUCT_HIERARCHY_AREA_OVERRIDE: AreaOverride = {
  [PRIMITIVE_ID.SIDEBAR]: {
    primitive: PRIMITIVE_ID.SIDEBAR,
    variant: "default",
    slots: {
      middle: moduleRef(MENU_MODULE_ID, {
        props: { items: QUICK_CATEGORY_ITEMS }
      })
    }
  }
};
