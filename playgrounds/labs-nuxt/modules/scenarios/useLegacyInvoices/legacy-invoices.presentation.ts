// -----------------------------------------------------------------------------
/**
 * @module scenarios/useLegacyInvoices/legacy-invoices.presentation
 * @description How an imported invoice row draws: the table, the card, the
 * read-only detail overlay — every one of design.md §8.13's seventeen
 * preserved-bill paths, never a flattened projection of them (D-16, ruling
 * PROJ-1) — its download-PDF control in the drawer footer, and the list's own
 * refresh and view controls. Every top-level scope is a
 * field of the mapped `LegacyInvoice` record (`legacy-invoices.types.ts`);
 * the detail overlay's extra scopes read the preserved bill, kept WHOLE
 * under `content`.
 */

import {
  ActionPlacementTypes,
  CardSlotTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import type {
  ActionsUischema,
  CardUischema,
  DetailUischema,
  ScenarioAction,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/**
 * The row's own conditions (`LegacyInvoice.meta`), one badge per true flag —
 * the same pattern client emails uses.
 */
const STATUS_BADGES = [
  {
    flag: "isPaid",
    i18n: "legacy_invoices.badge.paid",
    color: "success" as const
  },
  {
    flag: "isUnpaid",
    i18n: "legacy_invoices.badge.unpaid",
    color: "warning" as const
  },
  {
    flag: "isOverdue",
    i18n: "legacy_invoices.badge.overdue",
    color: "danger" as const
  },
  {
    flag: "isStaged",
    i18n: "legacy_invoices.badge.staged",
    color: "info" as const
  }
];

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/number",
      i18n: "legacy_invoices.table.number",
      options: { width: TableColumnWidthTypes.SIXTH }
    },
    {
      type: "TableCellText",
      scope: "#/properties/total_amount_formatted",
      i18n: "legacy_invoices.table.total"
    },
    {
      // The module publishes `create_datetime` as a raw string, never a
      // `useDate` descriptor — `TableCellDate` reads `.relative` off one and
      // draws empty against this column (scenario-derivation.md D6).
      type: "TableCellText",
      scope: "#/properties/create_datetime",
      i18n: "legacy_invoices.table.date_created"
    },
    {
      // Status and item count on the row (F1-R3): the row's own `meta` flags,
      // and the length of the preserved bill's `content.products`.
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "legacy_invoices.table.status",
      options: { badges: STATUS_BADGES }
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/products/properties/length",
      i18n: "legacy_invoices.table.items"
    }
  ]
};

export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/number",
      i18n: "legacy_invoices.table.number",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      // See the table's own note above — the field is a raw string, not a
      // `useDate` descriptor (scenario-derivation.md D7).
      type: "TableCellText",
      scope: "#/properties/create_datetime",
      i18n: "legacy_invoices.table.date_created",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/total_amount_formatted",
      i18n: "legacy_invoices.table.total",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      // Status and item count on the card (F1-R3), off the same preserved-bill
      // paths the table row and the detail overlay read.
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "legacy_invoices.table.status",
      options: { badges: STATUS_BADGES, slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/products/properties/length",
      i18n: "legacy_invoices.table.items",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/**
 * The download control — a DETAIL-port action, bound to the booted
 * `useLegacyInvoice().withId(id).useActions().downloadPdf` (ruling B5), never
 * to the list's own action map. It draws in the drawer's footer beside Close
 * (`DetailDialog`); a refusal (the typed `LegacyInvoiceDocumentNotReadyError`
 * or an ordinary failure) reads through `useActionFeedback`'s own captured
 * message, so the two outcomes read as different sentences (OD2, AC12).
 */
const downloadActions: ScenarioAction[] = [
  {
    type: "Action",
    name: "downloadPdf",
    i18n: "action.download_pdf",
    icon: "arrow-down",
    variant: "outline",
    placement: ActionPlacementTypes.VISIBLE,
    feedback: {
      success: "legacy_invoices.detail.download_success",
      failure: "legacy_invoices.detail.download_failure"
    }
  }
];

/**
 * The preserved bill (`content`) is kept WHOLE by the module (D-16); this
 * overlay reads every one of its paths straight, exactly the seventeen
 * `design.md` §8.13 enumerates (obligations 4-6 of §8.5 — the line-row
 * derivation and the three company members — are FE-1902's render-side
 * projection, ruling PROJ-1; this overlay reaches each PATH, never a
 * flattened re-projection of them).
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  actions: downloadActions,
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/number",
      i18n: "legacy_invoices.detail.number"
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/brand/properties/company_address",
      i18n: "legacy_invoices.detail.brand_address"
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/brand/properties/company_name",
      i18n: "legacy_invoices.detail.brand_name"
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/brand/properties/vat_number",
      i18n: "legacy_invoices.detail.brand_vat_number"
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/client/properties/fullname",
      i18n: "legacy_invoices.detail.client"
    },
    {
      // Absent from every recorded capture (design.md §8.13 row 6) — the
      // control is declared so the path is reachable, and it draws the
      // detail surface's own dash where the bill carries nothing.
      type: "TableCellText",
      scope: "#/properties/content/properties/client_company/properties/name",
      i18n: "legacy_invoices.detail.client_company_name"
    },
    {
      // Absent from every recorded capture (design.md §8.13 row 7).
      type: "TableCellText",
      scope:
        "#/properties/content/properties/client_company/properties/vat_number",
      i18n: "legacy_invoices.detail.client_company_vat_number"
    },
    {
      // Absent from every recorded capture (design.md §8.13 row 8).
      type: "TableCellText",
      scope:
        "#/properties/content/properties/client_company/properties/reg_number",
      i18n: "legacy_invoices.detail.client_company_reg_number"
    },
    {
      // NULL on the recorded capture (design.md §8.13 row 9). Drawn on the
      // whole block, per the block's own declared shape: no leaf is invented
      // where no capture names one.
      type: "TableCellText",
      scope: "#/properties/content/properties/client_address",
      i18n: "legacy_invoices.detail.client_address"
    },
    {
      // A raw string, not a `useDate` descriptor — see the table's own note.
      type: "TableCellText",
      scope: "#/properties/content/properties/create_datetime",
      i18n: "legacy_invoices.detail.date_created"
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/paid_datetime",
      i18n: "legacy_invoices.detail.date_paid"
    },
    {
      type: "TableCellList",
      scope: "#/properties/content/properties/products",
      i18n: "legacy_invoices.detail.products",
      options: {
        elements: [
          {
            type: "TableCellText",
            scope: "#/properties/description",
            i18n: "legacy_invoices.detail.product_description"
          },
          {
            type: "TableCellText",
            scope: "#/properties/name",
            i18n: "legacy_invoices.detail.product_name"
          },
          {
            type: "TableCellText",
            scope: "#/properties/product_name",
            i18n: "legacy_invoices.detail.product_alt_name"
          },
          {
            type: "TableCellText",
            scope: "#/properties/quantity",
            i18n: "legacy_invoices.detail.product_quantity"
          },
          {
            type: "TableCellText",
            scope: "#/properties/net_amount_formatted",
            i18n: "legacy_invoices.detail.product_total"
          }
        ]
      }
    },
    {
      type: "TableCellText",
      scope:
        "#/properties/content/properties/net_global_discount_amount_formatted",
      i18n: "legacy_invoices.detail.discount"
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/net_amount_formatted",
      i18n: "legacy_invoices.detail.subtotal"
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/tax_amount_formatted",
      i18n: "legacy_invoices.detail.tax"
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/total_amount_formatted",
      i18n: "legacy_invoices.detail.total"
    },
    {
      type: "TableCellText",
      scope: "#/properties/content/properties/status/properties/name",
      i18n: "legacy_invoices.detail.status"
    },
    {
      // The row's own `meta` flags as one status badge column, the same
      // STATUS_BADGES the table and card draw (gap A). The single read maps
      // through `mapLegacyInvoice`, so the drawer's model carries `meta`.
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES }
    }
  ]
};

/**
 * `view` is the only offered LIST control — it opens the detail overlay
 * (`detail: true`), so it sits outside AC-15's "non-detail action names a
 * live capability" check. No pay, cancel, refund, share or edit control is
 * drawn here, ever (AC-13, FE-3230 Out of Scope). The download control lives
 * on {@link detailUischema} instead — it is a DETAIL-port action, not a row
 * action on the list.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "view",
      detail: true,
      i18n: "action.view",
      icon: "eye",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      // The collection's own re-read, fired with no record, so it sits in the
      // page header (G4) — bound to `useLegacyInvoices().refresh`, the same
      // HEADER action `useTickets` declares (F1-S).
      type: "Action",
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER,
      feedback: {
        success: "confirm.legacy_invoices_refreshed",
        failure: "error.legacy_invoices_refresh_failed"
      }
    }
  ]
};
