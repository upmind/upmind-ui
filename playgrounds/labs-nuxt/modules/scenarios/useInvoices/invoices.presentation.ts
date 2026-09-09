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
 * `bundle.isLarge`, `nextChargeDate`, `datePaid` and the `summary` leaves
 * the table never shows (`balance`/`balanceFormatted` among them, AC-11).
 * This is where AC-5, AC-6, AC-8, AC-9 and AC-11 become visible.
 *
 * Every one of `address`, `currency`, `products`, `payments`,
 * `consolidation` and `bundle.groups` is a COMPOSITE (an object or an
 * array) — `TableCellText`/`TableCellHtml` both draw through
 * `resolveScope` + lodash `toString` (`cells/TableCellText.vue`,
 * `cells/TableCellHtml.vue`), which stringifies a composite to
 * `"[object Object]"`. None of the eight sibling `*.presentation.ts` files
 * in this tree scope a `TableCellText`/`TableCellHtml` at anything but a
 * SCALAR leaf (the precedent: `client-notes.presentation.ts`'s
 * `#/properties/contractProduct/properties/product_name`) — no sibling
 * draws an array at all. So `address` and `currency` are scoped to a
 * pre-formatted scalar leaf each (`address.description`, `currency.code`),
 * `consolidation` is scoped to its three AC-5 leaves individually
 * (`consolidationInvoiceId`, `creditInvoiceId`, `amountToCreditFormatted`),
 * and `products`/`payments`/`bundle.groups` — each genuinely a LIST no
 * scalar leaf can stand in for — are scoped to a list-shaped STRING the
 * mapper derives (`invoices.mappers.ts`'s `productsSummary`/
 * `paymentsSummary`/`bundle.groupsSummary`), drawn through the same
 * `TableCellText` every scalar leaf here already uses — no renderer is
 * minted. AC-16 (pending/failed discrimination) and AC-8 (a gateway
 * awaiting the client) live inside `paymentsSummary`'s per-entry state
 * label. AC-16's overall payment state is ALSO a
 * `useInvoice().useMeta().paymentState` computed, never a member of the
 * mapped `Invoice` row a cell scope can reach — it stays additionally
 * OBSERVABLE here through `summary.paidAmountFormatted`/
 * `summary.balanceFormatted`, never drawn as its own cell.
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
 * `confirm.*` / `error.*` key below. Composition-checked, not just
 * spelling-pending: every key here is a single complete literal, resolved
 * VERBATIM by JSONForms' i18n translator — none is built by concatenating a
 * prefix onto an already-complete key (the defect a previous cycle shipped
 * in `invoices.schemas.ts`'s filter-option vocabularies, since fixed there
 * — see that file's `STATUS_VOCABULARY` docblock). `invoices.filter_bar.*`
 * in `invoices.schemas.ts` is the same, already-correct shape.
 *
 * AC-1's `unpaidAmount` (`useInvoice().useContext().unpaidAmount`) is
 * DECLARED NOWHERE below — investigated, not overlooked. It is a SIBLING of
 * `data` on the context object, and `DetailDialog.vue`'s snapshot assembly
 * (`{ ...snap.context, model: snap.context.data }`) sets `model` to
 * `context.data` alone; every other context key, `unpaidAmount` included,
 * survives on `context` but never reaches `model`, which is the only object
 * `DetailSurface.vue`'s `CellDispatcher` ever scopes into. No declaration
 * here can redirect that assembly — it is `runtime/**` wiring, out of this
 * seat's write lane. So `unpaidAmount` is neither readable nor pressable on
 * this page today, contrary to this run's earlier "readable in the detail,
 * not pressable" characterisation — flagged for the design doc's
 * limitation #1 to correct.
 *
 * `useInvoices().useMeta().hasUnpaid` / `.consolidatableCount` are likewise
 * declared nowhere: `ScenarioPresentation` (`scenario.types.ts`) offers only
 * `icon`/`table`/`card`/`detail`/`actions` — no meta/summary channel a
 * declaration can populate. `MetaPanel.vue` (`runtime/components/`) could
 * draw them, but it is mounted by no surface anywhere in the tree; wiring it
 * in is a `runtime/**` template change beyond a declaration, out of this
 * seat's write lane.
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
 * list row holds, and this is where that extra depth (AC-4's read half,
 * AC-5, AC-6, AC-8, AC-9, AC-11) becomes visible.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      // The address OBJECT stringifies to "[object Object]" through
      // TableCellText's `resolveScope` + lodash `toString` — scoped to its
      // own pre-formatted leaf instead (`Address.description`,
      // `client-address.types.ts`: "a detailed description ... potentially
      // including full address lines").
      type: "TableCellText",
      scope: "#/properties/address/properties/description",
      i18n: "invoices.detail.address"
    },
    {
      // Same defect, same fix: the currency OBJECT to its own scalar code.
      type: "TableCellText",
      scope: "#/properties/currency/properties/code",
      i18n: "invoices.detail.currency"
    },
    {
      // `products` is an ARRAY — no scalar leaf stands in for it, so it is
      // scoped to the mapper's own list-shaped read (`productsSummary`,
      // `invoices.mappers.ts`), drawn through the same TableCellText every
      // scalar leaf here already uses.
      type: "TableCellText",
      scope: "#/properties/productsSummary",
      i18n: "invoices.detail.products"
    },
    {
      // AC-6/AC-16 — `payments` is an ARRAY; `paymentsSummary` discriminates
      // pending/failed per entry (AC-16) and flags a gateway awaiting the
      // client (AC-8), the same list-shaped-string treatment as `products`.
      type: "TableCellText",
      scope: "#/properties/paymentsSummary",
      i18n: "invoices.detail.payments"
    },
    {
      // AC-4's read half — the invoice's OWN assigned method, mapped from
      // `raw.payment_details` (`invoices.mappers.ts`'s `mapPaymentMethod`)
      // and readable for the first time in this fix (previously fetched and
      // dropped by `mapInvoice`). `label` is `""` when none is assigned,
      // which `isPopulated` (`DetailSurface.vue`) reads as "—".
      type: "TableCellText",
      scope: "#/properties/paymentMethod/properties/label",
      i18n: "invoices.detail.payment_method"
    },
    {
      // AC-5 — which document this invoice merged INTO.
      type: "TableCellText",
      scope: "#/properties/consolidation/properties/consolidationInvoiceId",
      i18n: "invoices.detail.consolidation_invoice"
    },
    {
      // AC-5 — which credit note PARTNERS this invoice.
      type: "TableCellText",
      scope: "#/properties/consolidation/properties/creditInvoiceId",
      i18n: "invoices.detail.credit_invoice"
    },
    {
      // AC-5 — how much is queued for credit.
      type: "TableCellText",
      scope: "#/properties/consolidation/properties/amountToCreditFormatted",
      i18n: "invoices.detail.amount_to_credit"
    },
    {
      // AC-5 — `bundle.groups` is an ARRAY of groups; `groupsSummary` is its
      // list-shaped read, same treatment as `productsSummary`.
      type: "TableCellText",
      scope: "#/properties/bundle/properties/groupsSummary",
      i18n: "invoices.detail.bundle_groups"
    },
    {
      // AC-6 — the >5-product flag, declared nowhere before this fix.
      type: "TableCellIcon",
      scope: "#/properties/bundle/properties/isLarge",
      i18n: "invoices.detail.bundle_is_large",
      options: { icon: "box" }
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
      icon: "box",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      // AC-7 — every credit note, collection-scoped.
      name: "filterCreditNotes",
      i18n: "action.filter_credit_notes",
      icon: "file-attachment-01",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      // AC-7 — this invoice's own credit notes, row-scoped.
      name: "filterCreditNotes",
      i18n: "action.view_credit_notes",
      icon: "file-attachment-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      // AC-3 — the list-side refetch a payment outcome triggers.
      name: "refreshAfterPayment",
      i18n: "action.refresh_after_payment",
      icon: "refresh-cw-01",
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
