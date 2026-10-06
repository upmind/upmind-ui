// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientCustomPages/client-custom-pages.presentation
 * @description How a brand's client-area custom page DRAWS — the collection
 * as a table, and ONE page READ-ONLY in the detail overlay. Grounded field by
 * field on the live row `useClientCustomPages().useContext().data` publishes
 * (`CustomPage` in `client-custom-pages.types.ts`), so nothing here describes
 * a shape the composable does not produce.
 *
 * The detail overlay is the point of the FETCH path (AC3/AC4): opening a row
 * resolves through `useClientCustomPage().withId(slug)`, whose `enabled`
 * gate (`client-custom-pages.services.ts`'s `loadOne`) short-circuits to the
 * SAME-actor collection instance's already-loaded row when one is mounted
 * (O9/O10/O11) and issues the single-read request only when it is not — this
 * page's list and detail share one actor (`props.detail.actor`, `DetailDialog.vue`),
 * so the pairing this guard consults is exactly the one this scenario mounts.
 *
 * Excluded fields: `id` (system value); `brandId` (system reference, not a
 * client-facing concern). The page BODY is out of scope here — it is the
 * client area's own template surface (AC6), not a member of `CustomPage`.
 *
 * ORDERING is not here at all: the collection is ordered by the query
 * schema's own `sort` enum, which the control reads directly.
 */

import { ActionPlacementTypes, CardSlotTypes } from "../runtime/scenario.types";
import type {
  ActionsUischema,
  CardUischema,
  DetailUischema,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      // The star marks the pages the nav injects (D4, parity O25).
      type: "TableCellIcon",
      scope: "#/properties/showOnMenu",
      i18n: "text.show_on_menu_label",
      options: { icon: "star-01" }
    },
    {
      type: "TableCellText",
      scope: "#/properties/menuLabel",
      i18n: "text.menu_label"
    },
    {
      type: "TableCellText",
      scope: "#/properties/slug",
      i18n: "text.slug_label"
    }
  ]
};

/**
 * The SAME record, drawn as a card — a second declaration, never a second
 * component. The menu label rides the TITLE slot, slug on SUBTITLE.
 */
export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellIcon",
      scope: "#/properties/showOnMenu",
      i18n: "text.show_on_menu_label",
      options: { icon: "star-01", slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/menuLabel",
      i18n: "text.menu_label",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/slug",
      i18n: "text.slug_label",
      options: { slot: CardSlotTypes.SUBTITLE }
    }
  ]
};

/**
 * ONE page drawn READ-ONLY — the same cell renderers the table uses, over
 * the full resolved row (`title`, which the list row already carries too,
 * unlike the email-history sibling's `body`: `CustomPage` has no member the
 * list omits — AC3 proves the SAME row resolves, not a richer one).
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    { type: "TableCellText", scope: "#/properties/title", i18n: "text.title" },
    {
      type: "TableCellText",
      scope: "#/properties/menuLabel",
      i18n: "text.menu_label"
    },
    {
      type: "TableCellText",
      scope: "#/properties/slug",
      i18n: "text.slug_label"
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/showOnMenu",
      i18n: "text.show_on_menu_label",
      options: { icon: "star-01" }
    }
  ]
};

/**
 * The one control the module offers: open the page READ-ONLY. It calls no
 * live action and opens no editor — the module has no mutation surface
 * (parity O24: `reloadData` is the oracle's ONLY method) — so it declares
 * `detail`, and the overlay's `useClientCustomPage` read resolves it (AC3).
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "view",
      detail: true,
      i18n: "action.view_custom_page",
      icon: "eye",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    }
  ]
};
