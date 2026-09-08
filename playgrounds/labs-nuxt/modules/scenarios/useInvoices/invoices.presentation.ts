// -----------------------------------------------------------------------------
/**
 * @module scenarios/useInvoices/invoices.presentation
 * @description How an invoice row DRAWS — the table, the same row as a card,
 * the read-only detail overlay (fetched fresh through `useInvoice`), and
 * every action's presentation and precondition. Grounded field by field on
 * the record `useInvoices().useContext().data` publishes (`Invoice` in
 * `invoices.types.ts`), so nothing here describes a shape the composable
 * does not produce.
 *
 * D6 exclusions from the table's DEFAULT visible set, echoed and never
 * silently re-added — the column picker still offers every mapped field;
 * this element list decides only the default set, header row, order and
 * renderers: `id` (system value, stays reachable through the binding's
 * default `id` identifier), `category.slug` (duplicate of `category.label`,
 * which is already `is_consolidation`-aware), `address` (always empty on a
 * list row — `LOAD_LIST_INCLUDES` never requests it, only `loadOne` does),
 * `currency` (duplicate — every drawn amount is pre-formatted with its own
 * symbol), `products`, `payments`, `consolidation`, `bundle`, the rest of
 * `summary`, `nextChargeDate` (sparse) and `datePaid` (paid-only, and
 * `status` already carries it).
 *
 * `attribution` earns `TableCellBadges` as a boolean group even though this
 * record has no `meta` key — the badge map below keys directly on the four
 * `attribution` booleans (`invoices.types.ts:311-317`), precedent
 * `useClientNotes/client-notes.presentation.ts:129-132`. On a `client x
 * client` list it is the column that answers "whose invoice is this"
 * (AC-13).
 *
 * The DETAIL overlay draws what the table omits by design: `address`,
 * `currency`, `products`, `payments`, `consolidation`, `bundle.groups`,
 * `nextChargeDate`, `datePaid` and the `summary` leaves the table never
 * shows (`balance`/`balanceFormatted` among them, AC-11). This is where
 * AC-5, AC-6, AC-8, AC-9 and AC-11 become visible. AC-16 (the overall
 * payment state) is a `useInvoice().useMeta().paymentState` computed, never
 * a member of the mapped `Invoice` row a cell scope can reach — it becomes
 * OBSERVABLE here through the same raw data it is derived from (`payments`,
 * `summary.paidAmountFormatted`, `summary.balanceFormatted`), never drawn as
 * its own cell.
 *
 * AC-4 (design.md D1): `assignPaymentMethod`'s clear half is NOT drawn as a
 * row control — the generic single-arg row press (`ListSurface.vue`'s
 * `pressRowAction`, `props.actions[action.name](row.id)`) invokes the named
 * member BARE, supplying only `invoiceId`; there is no declaration-level
 * channel that binds a second, static argument (confirmed: no such field
 * exists anywhere in `scenario.types.ts`). `paymentDetailsId` would arrive
 * `undefined`, which `JSON.stringify` drops from the wire — an OMITTED key,
 * not the explicit PRESENT `null` D1 requires (`invoices.types.ts`'s
 * `InvoicePaymentDetailsModel` docblock: "clearing the assignment sends
 * `null` as a PRESENT key, never an omitted one"). A bare press is not a
 * degraded clear, it is the wrong request — exactly the failure the
 * module's own `invoices.clear-method-omitted.must-fail.patch` negative
 * control exists to catch — so drawing the control and firing a success
 * toast over it would claim a capability the page cannot perform. Withdrawn
 * per the same honesty this page already applies to `refreshUnpaidAmount`
 * (AC-1, below): a live action with no channel that can drive it correctly
 * draws no control, rather than one that draws and does nothing (or worse,
 * does the wrong thing quietly). Minting a second-argument channel is
 * playground-runtime work (`scenario.types.ts`), out of this seat's write
 * lane (`useInvoices/**` only).
 *
 * PENDING i18n — these keys are referenced below but may not yet exist in
 * `packages/i18n/src/core/*-en.json` (out of this seat's write lane for that
 * package): every `invoices.table.*` / `invoices.detail.*` / `action.*` /
 * `confirm.*` / `error.*` key below.
 *
 * ORDERING is not here at all: the collection is ordered by the query
 * schema's own `sort` enum, which the sort control reads directly
 * (`invoices.types.ts`'s `InvoiceSortableField`).
 */

import { ActionPlacementTypes, CardSlotTypes } from "../runtime/scenario.types";
import type {
  ActionsUischema,
  CardUischema,
  DetailUischema,
  TableBadge,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/**
 * AC-13's co-mingled row attribution, keyed on the four `attribution`
 * booleans (`invoices.types.ts:311-317`) rather than a `meta` group — this
 * record has no `meta` key, so the template's `meta` example does not
 * apply. A badge appears only when its flag is set.
 */
const ATTRIBUTION_BADGES: TableBadge[] = [
  { flag: "isOwn", i18n: "invoices.badge.own", color: "neutral" },
  {
    flag: "isChildOfClient",
    i18n: "invoices.badge.child_of_client",
    color: "info"
  },
  { flag: "isDelegated", i18n: "invoices.badge.delegated", color: "warning" },
  {
    flag: "isSettleable",
    i18n: "invoices.badge.settleable",
    color: "success"
  }
];

/**
 * The WHOLE table: this one element list gives the header row (each
 * element's `i18n`), the column order, every cell's renderer, and the
 * column picker's DEFAULT visible set. The picker's OPTIONS are wider —
 * every field of the mapped record is offerable — so a field left out here
 * is still switchable on.
 */
export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/number",
      i18n: "invoices.table.number"
    },
    {
      type: "TableCellText",
      scope: "#/properties/status",
      i18n: "invoices.table.status"
    },
    {
      type: "TableCellText",
      scope: "#/properties/category/properties/label",
      i18n: "invoices.table.category"
    },
    {
      type: "TableCellText",
      scope: "#/properties/client/properties/display",
      i18n: "invoices.table.client"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/attribution",
      i18n: "invoices.table.attribution",
      options: { badges: ATTRIBUTION_BADGES }
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/total",
      i18n: "invoices.table.total"
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/unpaidAmountFormatted",
      i18n: "invoices.table.unpaid"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/dateCreated",
      i18n: "invoices.table.date_created"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/dateDue",
      i18n: "invoices.table.date_due"
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/locked",
      i18n: "invoices.table.locked",
      options: { icon: "lock-01" }
    }
  ]
};

/**
 * The SAME record, drawn as a card — a second declaration, never a second
 * component. `number`, `attribution` and `status` ride the TITLE slot,
 * `dateDue` sits in SUBTITLE, and the remaining financial/category summary
 * fills BODY.
 */
export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/number",
      i18n: "invoices.table.number",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/attribution",
      i18n: "invoices.table.attribution",
      options: { badges: ATTRIBUTION_BADGES, slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/status",
      i18n: "invoices.table.status",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/dateDue",
      i18n: "invoices.table.date_due",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/total",
      i18n: "invoices.table.total",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/unpaidAmountFormatted",
      i18n: "invoices.table.unpaid",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/category/properties/label",
      i18n: "invoices.table.category",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/**
 * The SAME record drawn READ-ONLY in the detail overlay — fetched fresh
 * through `useInvoice` (`.withId(id)`, keyed off the clicked row's `id`),
 * never the clicked row's own stale copy. Its field set exceeds the
 * table's default on purpose: a record fetched in full carries more than a
 * list row holds, and this is where that extra depth (AC-5, AC-6, AC-8,
 * AC-9, AC-11) becomes visible.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/address",
      i18n: "invoices.detail.address"
    },
    {
      type: "TableCellText",
      scope: "#/properties/currency",
      i18n: "invoices.detail.currency"
    },
    {
      type: "TableCellText",
      scope: "#/properties/products",
      i18n: "invoices.detail.products"
    },
    {
      type: "TableCellText",
      scope: "#/properties/payments",
      i18n: "invoices.detail.payments"
    },
    {
      type: "TableCellText",
      scope: "#/properties/consolidation",
      i18n: "invoices.detail.consolidation"
    },
    {
      type: "TableCellText",
      scope: "#/properties/bundle/properties/groups",
      i18n: "invoices.detail.bundle_groups"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/nextChargeDate",
      i18n: "invoices.detail.next_charge_date"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/datePaid",
      i18n: "invoices.detail.date_paid"
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/subtotal",
      i18n: "invoices.detail.subtotal"
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/discount",
      i18n: "invoices.detail.discount"
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/paidAmountFormatted",
      i18n: "invoices.detail.paid_amount"
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/balanceFormatted",
      i18n: "invoices.detail.balance"
    }
  ]
};

/**
 * Every action the module offers, in the order they are drawn — ONE list
 * for the row and the card alike. Each `name` is a live member of
 * `useInvoices().useActions()`, except `view`, which opens the read-only
 * detail overlay (`scenario.types.ts`'s `detail` exemption, precedent
 * `useClientNotes/client-notes.presentation.ts:290-291`) — no
 * `add`/`edit`/`ensure` capability exists on this module (D3: it ships no
 * `useMutate`), so there is no create control and no handoff.
 *
 * `destroy`, `isReady`, `setCriteria` and `sortBy` are deliberately never
 * drawn: `destroy` removes the scoped instance from the registry (pressing
 * it breaks the page), `isReady` is a promise the framework awaits, and
 * `setCriteria`/`sortBy` are the filter bar's and sort control's own write
 * channels, resolved off the criteria schema rather than an action control
 * (`CHANNELS.md`).
 *
 * `filterCreditNotes` is drawn TWICE (AC-7) — once collection-scoped in the
 * HEADER (no `invoiceId`, every credit note) and once row-scoped in
 * `VISIBLE` (the generic single-arg row press supplies the clicked row's
 * `id` as `invoiceId`, narrowing to that invoice's own credit notes) — one
 * capability, two placements, matching the derivation table.
 *
 * `assignPaymentMethod` (AC-4's clear half) is not drawn here — see this
 * file's module docblock — so no row control reads the `locked` flag for it.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER,
      feedback: {
        success: "confirm.invoices_refreshed",
        failure: "error.invoices_refresh_failed"
      }
    },
    {
      type: "Action",
      // AC-2 — narrows the list to invoices this client could consolidate.
      name: "filterConsolidatable",
      i18n: "action.filter_consolidatable",
      icon: "layers-two-01",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      // AC-7 — every credit note, collection-scoped.
      name: "filterCreditNotes",
      i18n: "action.filter_credit_notes",
      icon: "file-minus-02",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      // AC-7 — this invoice's own credit notes, row-scoped.
      name: "filterCreditNotes",
      i18n: "action.view_credit_notes",
      icon: "file-minus-02",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      // AC-3 — the list-side refetch a payment outcome triggers.
      name: "refreshAfterPayment",
      i18n: "action.refresh_after_payment",
      icon: "credit-card-refresh",
      variant: "outline",
      placement: ActionPlacementTypes.OVERFLOW,
      feedback: {
        success: "confirm.invoices_payment_refreshed",
        failure: "error.invoices_payment_refresh_failed"
      }
    },
    {
      type: "Action",
      name: "invalidate",
      i18n: "action.invalidate",
      icon: "alert-triangle",
      variant: "outline",
      placement: ActionPlacementTypes.OVERFLOW
    },
    {
      type: "Action",
      name: "view",
      detail: true,
      i18n: "action.view",
      icon: "eye",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    }
  ]
};
