// -----------------------------------------------------------------------------
/**
 * @module portal/config/billing-pages
 * @description The billing pillar's shared page compositions (plan Phase E)
 * — legacy's billing section: invoices (Unpaid payable / Paid / Credited),
 * the invoice document, orders and the order detail (summary + its invoices
 * + its credit notes, one page), credit notes, payment methods (add/remove
 * mocked), and the account-credit balance. Detail pages key off the route's
 * `entityId` (mock/injection.ts).
 *
 * One grammar throughout (operator request 2026-08-26, extending the
 * dashboard pass): every group is a PANEL with a title and description over
 * a flat list; header actions are quiet (outline, sm), never the page's
 * bold primary.
 */

import { CONTENT_MEASURE, ROW_LAYOUT, ROW_SURFACE } from "../content/types";
import { MOCK_ACTION } from "../mock/actions";
import { DATA_REF_ID, dataRef } from "../mock/data-refs";
import { BANNER_VARIANT } from "../modules/banner/types";
import { BUTTON_MODULE_VARIANT } from "../modules/button/types";
import { DOCUMENT_MODULE_VARIANT } from "../modules/document/types";
import { LIST_MODULE_VARIANT } from "../modules/list/types";
import {
  EMPTY_STATE_MODULE_ID,
  BANNER_MODULE_ID,
  BUTTON_MODULE_ID,
  DOCUMENT_MODULE_ID,
  FORM_MODULE_ID,
  LIST_MODULE_ID,
  METER_MODULE_ID,
  SPEC_MODULE_ID,
  moduleGroup,
  moduleRef
} from "../registry";
import { GROUP_AXIS, PAGE_KEY } from "../types";
import {
  PACKAGE_STUB_TITLE,
  packageStubPage,
  packageStubProse
} from "./package-stub";
import { brandNoteRow, pagerFooter, panelControls, statusRail } from "./pager";
import { assign } from "lodash-es";
import type { ContentRowConfig, RowHeaderControls } from "../content/types";
import type { DataRefId } from "../mock/data-refs";
import type { DataRef } from "../mock/data-refs";
import type {
  DocumentModuleHeading,
  DocumentModuleVariant
} from "../modules/document/types";
import type { ListModuleHeading } from "../modules/list/types";
import type { ContentConfig, PageKey, SlotAssignment } from "../types";

/** What a panel's heading carries beyond its words: trailing actions, and the control band under them. */
type PanelHeading = {
  readonly actions?: SlotAssignment;
  readonly controls?: RowHeaderControls;
};

// The billing panels' column headings — a document number, its dates, its
// amount and its state read as columns, which is what these ledgers are. The
// last heading names the row's own action column, and stays wordless: the
// buttons under it say what they do.
const INVOICE_HEADINGS: readonly ListModuleHeading[] = [
  { label: "Invoice" },
  { label: "Issued" },
  { label: "Due" },
  { label: "Total", numeric: true },
  { label: "Status" },
  { label: "" }
];

const CREDIT_NOTE_HEADINGS: readonly ListModuleHeading[] = [
  { label: "Credit note" },
  { label: "Issued" },
  { label: "Against" },
  { label: "Total", numeric: true },
  { label: "Status" }
];

const WALLET_BALANCE_HEADINGS: readonly ListModuleHeading[] = [
  { label: "Currency" },
  { label: "Balance", numeric: true }
];

const CREDIT_STATEMENT_HEADINGS: readonly ListModuleHeading[] = [
  { label: "Period" },
  { label: "Opening", numeric: true },
  { label: "Credits", numeric: true },
  { label: "Debits", numeric: true },
  { label: "Closing", numeric: true }
];

const CREDIT_STATEMENT_MOVEMENT_HEADINGS: readonly ListModuleHeading[] = [
  { label: "Description" },
  { label: "Date" },
  { label: "Amount", numeric: true },
  { label: "Balance", numeric: true }
];

/** The document tables' own column headings — both documents read the same way. */
const DOCUMENT_LINE_HEADINGS: readonly DocumentModuleHeading[] = [
  { label: "Description" },
  { label: "Qty", numeric: true },
  { label: "Unit price", numeric: true },
  { label: "Amount", numeric: true }
];

const DOCUMENT_PAYMENT_HEADINGS: readonly DocumentModuleHeading[] = [
  { label: "Date" },
  { label: "Method" },
  { label: "Amount", numeric: true },
  { label: "Status" }
];

function panelRow(
  title: string,
  description: string,
  slot: SlotAssignment,
  heading?: PanelHeading
): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    surface: ROW_SURFACE.PANEL,
    header: {
      title,
      description,
      actions: heading?.actions,
      controls: heading?.controls
    },
    slots: [slot]
  };
}

/** A panel whose list is a PAGED collection — same row, plus the pager footer. */
function pagedPanelRow(
  title: string,
  description: string,
  refId: Parameters<typeof dataRef>[0],
  emptyTitle: string,
  heading?: PanelHeading,
  headings?: readonly ListModuleHeading[],
  emptyAction?: DataRef
): ContentRowConfig {
  return assign(
    panelRow(
      title,
      description,
      billingList(refId, emptyTitle, headings, emptyAction),
      heading
    ),
    { footer: pagerFooter(title, refId) }
  );
}

/**
 * A billing panel's rows. Given headings the row is a real TABLE — a document
 * number, its dates and its amount are columns, and `@upmind/ui`'s own `Table`
 * renders them; without them the rows stay the compact stack a card list wants.
 */
function billingList(
  refId: Parameters<typeof dataRef>[0],
  emptyTitle: string,
  headings?: readonly ListModuleHeading[],
  emptyAction?: DataRef
): SlotAssignment {
  if (headings === undefined) {
    return moduleRef(LIST_MODULE_ID, {
      variant: LIST_MODULE_VARIANT.COMPACT,
      props: { items: dataRef(refId), emptyTitle, emptyAction }
    });
  }
  return moduleRef(LIST_MODULE_ID, {
    variant: LIST_MODULE_VARIANT.TABLE,
    props: { items: dataRef(refId), emptyTitle, headings, emptyAction }
  });
}

function specSlot(
  refId: Parameters<typeof dataRef>[0],
  emptyTitle: string
): SlotAssignment {
  return moduleRef(SPEC_MODULE_ID, {
    props: { items: dataRef(refId), emptyTitle }
  });
}

/**
 * A control cluster whose ACTIONS are data: the panel renders whatever the
 * dataset offers, and nothing at all when it offers none (`button` module —
 * an empty action set with no empty copy renders nothing).
 */
function dataActions(
  refId: Parameters<typeof dataRef>[0],
  label: string
): SlotAssignment {
  return moduleRef(BUTTON_MODULE_ID, {
    variant: BUTTON_MODULE_VARIANT.GROUP,
    props: { label, tone: "outline", size: "sm", actions: dataRef(refId) }
  });
}

/**
 * Legacy's `invoiceConsolidationMsg`, over the listing: how many documents
 * could be brought together, and the control that does it. Every part is a
 * ref — the count is the message, so it is the dataset's to word.
 */
const CONSOLIDATION_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  visible: dataRef(DATA_REF_ID.INVOICE_CONSOLIDATION_VISIBLE),
  slots: [
    moduleRef(BANNER_MODULE_ID, {
      variant: BANNER_VARIANT.NOTICE,
      props: {
        title: "Bring your invoices together",
        message: dataRef(DATA_REF_ID.INVOICE_CONSOLIDATION_MESSAGE),
        tone: "warning",
        action: dataRef(DATA_REF_ID.INVOICE_CONSOLIDATION_ACTION),
        label: "Invoice consolidation",
        dismissLabel: "Dismiss"
      }
    })
  ]
};

/** Legacy's own `itemCap` — past it the lines table collapses (`invoiceItems.vue:326`). */
const DOCUMENT_LINE_CAP = 20;

/** The cap the SCREEN applies; the print view carries every line it was given. */
function screenLineCap(variant: DocumentModuleVariant): number | undefined {
  if (variant === DOCUMENT_MODULE_VARIANT.PRINT) return undefined;
  return DOCUMENT_LINE_CAP;
}

/** The one document composition both billing documents render, on screen and on paper. */
function documentSlot(
  parts: {
    readonly header: Parameters<typeof dataRef>[0];
    readonly party: Parameters<typeof dataRef>[0];
    readonly lines: Parameters<typeof dataRef>[0];
    readonly totals: Parameters<typeof dataRef>[0];
    readonly payments: Parameters<typeof dataRef>[0];
    readonly messages?: Parameters<typeof dataRef>[0];
    readonly actions: Parameters<typeof dataRef>[0];
  },
  emptyTitle: string,
  paymentsTitle: string,
  variant: DocumentModuleVariant,
  paidStamp?: DataRefId,
  details?: DataRefId
): SlotAssignment {
  return moduleRef(DOCUMENT_MODULE_ID, {
    variant,
    props: {
      header: dataRef(parts.header),
      party: dataRef(parts.party),
      lines: dataRef(parts.lines),
      totals: dataRef(parts.totals),
      payments: dataRef(parts.payments),
      messages: parts.messages && dataRef(parts.messages),
      paidStamp: paidStamp && dataRef(paidStamp),
      details: details && dataRef(details),
      actions: dataRef(parts.actions),
      lineHeadings: DOCUMENT_LINE_HEADINGS,
      paymentHeadings: DOCUMENT_PAYMENT_HEADINGS,
      // The cap is a SCREEN affordance: paper has no control to press, so a
      // printed document that folded its lines would simply lose them.
      lineCap: screenLineCap(variant),
      showMoreLinesLabel: "Show {n} more items",
      showLessLinesLabel: "Show less",
      paymentsTitle,
      emptyTitle
    }
  });
}

function invoiceDocument(
  variant: DocumentModuleVariant = DOCUMENT_MODULE_VARIANT.DEFAULT
): SlotAssignment {
  return documentSlot(
    {
      header: DATA_REF_ID.INVOICE_DOCUMENT_HEADER,
      party: DATA_REF_ID.INVOICE_DOCUMENT_PARTY,
      lines: DATA_REF_ID.INVOICE_DOCUMENT_LINES,
      totals: DATA_REF_ID.INVOICE_DOCUMENT_TOTALS,
      payments: DATA_REF_ID.INVOICE_DOCUMENT_PAYMENTS,
      messages: DATA_REF_ID.INVOICE_DOCUMENT_MESSAGES,
      actions: DATA_REF_ID.INVOICE_DOCUMENT_ACTIONS
    },
    "No such invoice",
    "Payments",
    variant,
    DATA_REF_ID.INVOICE_DOCUMENT_PAID_STAMP,
    // Legacy printed the well on an INVOICE and never on a credit note.
    DATA_REF_ID.INVOICE_DOCUMENT_DETAILS
  );
}

function creditNoteDocument(
  variant: DocumentModuleVariant = DOCUMENT_MODULE_VARIANT.DEFAULT
): SlotAssignment {
  return documentSlot(
    {
      header: DATA_REF_ID.CREDIT_NOTE_DOCUMENT_HEADER,
      party: DATA_REF_ID.CREDIT_NOTE_DOCUMENT_PARTY,
      lines: DATA_REF_ID.CREDIT_NOTE_DOCUMENT_LINES,
      totals: DATA_REF_ID.CREDIT_NOTE_DOCUMENT_TOTALS,
      payments: DATA_REF_ID.CREDIT_NOTE_DOCUMENT_PAYMENTS,
      messages: DATA_REF_ID.CREDIT_NOTE_DOCUMENT_MESSAGES,
      actions: DATA_REF_ID.CREDIT_NOTE_DOCUMENT_ACTIONS
    },
    "No such credit note",
    "Refunds",
    variant
  );
}

function payWithStub(): SlotAssignment {
  return moduleRef(EMPTY_STATE_MODULE_ID, {
    props: {
      title: PACKAGE_STUB_TITLE,
      description: packageStubProse("PaymentDetails", "payment")
    }
  });
}

/** The credit-limit panel's own meter, riding the header beside the figures. */
function creditLimitMeter(): SlotAssignment {
  return moduleRef(METER_MODULE_ID, {
    props: {
      value: dataRef(DATA_REF_ID.WALLET_CREDIT_USED),
      max: dataRef(DATA_REF_ID.WALLET_CREDIT_ALLOWANCE),
      // Legacy's own four bands, off what is LEFT of the allowance.
      tone: dataRef(DATA_REF_ID.WALLET_CREDIT_TONE),
      label: "Credit limit used"
    }
  });
}

/**
 * A print view: the same document on a bare page, with the browser's own
 * print control and the way back (plan R11). Nothing prints itself — the
 * client asks.
 */
function printPage(
  title: string,
  document: SlotAssignment,
  backTo: string
): ContentConfig {
  return {
    title,
    description: "Print or save this document.",
    measure: CONTENT_MEASURE.READING,
    footer: false,
    rows: [
      {
        layout: ROW_LAYOUT.FULL,
        header: {
          title,
          actions: moduleGroup(GROUP_AXIS.HORIZONTAL, [
            moduleRef(BUTTON_MODULE_ID, {
              variant: BUTTON_MODULE_VARIANT.SINGLE,
              props: {
                label: "Back",
                tone: "ghost",
                size: "sm",
                to: backTo
              }
            }),
            moduleRef(BUTTON_MODULE_ID, {
              variant: BUTTON_MODULE_VARIANT.SINGLE,
              props: {
                label: "Print",
                tone: "outline",
                size: "sm",
                value: MOCK_ACTION.PRINT
              }
            })
          ])
        },
        slots: [document]
      }
    ]
  };
}

export function billingPages(): Partial<Record<PageKey, ContentConfig>> {
  const page = (
    title: string,
    description: string,
    rows: readonly ContentRowConfig[]
  ): ContentConfig => ({ title, description, rows, footer: false });

  return {
    [PAGE_KEY.BILLING_INVOICES]: page(
      "Invoices",
      "Everything billed to your account.",
      [
        brandNoteRow(
          DATA_REF_ID.TEMPLATE_INVOICES_MARKDOWN,
          DATA_REF_ID.TEMPLATE_HAS_INVOICES
        ),
        CONSOLIDATION_ROW,
        // Legacy's All / Unpaid / Paid / Credited routes, as a rail in the
        // panel's control band. An unpaid row stays payable in every tab.
        pagedPanelRow(
          "Invoices",
          "Everything billed to your account. Unpaid invoices stay payable wherever they appear.",
          DATA_REF_ID.INVOICE_ITEMS,
          "No invoices yet",
          {
            controls: panelControls(
              DATA_REF_ID.INVOICE_ITEMS,
              "invoices",
              "Search by number",
              statusRail(DATA_REF_ID.INVOICE_TABS, DATA_REF_ID.INVOICE_STATUS)
            )
          },
          INVOICE_HEADINGS
        )
      ]
    ),
    [PAGE_KEY.BILLING_INVOICE_DETAIL]: page(
      "Invoice",
      "The document, its charges and its payment status.",
      [
        panelRow(
          "Document",
          "Everything this invoice says, as it was issued.",
          invoiceDocument()
        ),
        // Only while something is owed: a settled invoice has nothing to
        // choose a card for (content/types.ts `visible`).
        assign(
          panelRow(
            "Pay with",
            "Choose a saved card to settle this invoice.",
            payWithStub()
          ),
          { visible: dataRef(DATA_REF_ID.INVOICE_IS_PAYABLE) }
        )
      ]
    ),
    [PAGE_KEY.BILLING_INVOICE_PRINT]: printPage(
      "Invoice",
      invoiceDocument(DOCUMENT_MODULE_VARIANT.PRINT),
      "/billing/invoices"
    ),
    [PAGE_KEY.BILLING_ORDERS]: packageStubPage(
      "Orders",
      "Your order history and each order's documents.",
      "UpmOrder",
      "orders"
    ),
    [PAGE_KEY.BILLING_ORDER_DETAIL]: page(
      "Order",
      "What you ordered, and the invoices it raised.",
      []
    ),
    [PAGE_KEY.BILLING_CREDIT_NOTES]: page(
      "Credit notes",
      "Credits issued back to your account.",
      [
        pagedPanelRow(
          "All credit notes",
          "Each one offsets an invoice and tops up your balance.",
          DATA_REF_ID.CREDIT_NOTE_LIST_ITEMS,
          "No credit notes",
          {
            controls: panelControls(
              DATA_REF_ID.CREDIT_NOTE_LIST_ITEMS,
              "credit notes",
              "Search by number"
            )
          },
          CREDIT_NOTE_HEADINGS
        )
      ]
    ),
    [PAGE_KEY.BILLING_CREDIT_NOTE_DETAIL]: page(
      "Credit note",
      "The credit, what was refunded, and the invoice it offsets.",
      [
        panelRow(
          "Document",
          "Everything this credit note says, as it was issued.",
          creditNoteDocument()
        ),
        panelRow(
          "Offsets",
          "The invoice this credit was raised against.",
          billingList(DATA_REF_ID.CREDIT_NOTE_INVOICE_ITEMS, "No invoice")
        )
      ]
    ),
    [PAGE_KEY.BILLING_CREDIT_STATEMENT_PRINT]: printPage(
      "Credit statement",
      moduleGroup(GROUP_AXIS.VERTICAL, [
        specSlot(DATA_REF_ID.CREDIT_STATEMENT_SPEC_ITEMS, "No such statement"),
        billingList(
          DATA_REF_ID.CREDIT_STATEMENT_MOVEMENT_ITEMS,
          "No movements in this period",
          CREDIT_STATEMENT_MOVEMENT_HEADINGS
        )
      ]),
      "/billing/credit"
    ),
    [PAGE_KEY.BILLING_CREDIT_NOTE_PRINT]: printPage(
      "Credit note",
      creditNoteDocument(DOCUMENT_MODULE_VARIANT.PRINT),
      "/billing/credit-notes"
    ),
    [PAGE_KEY.BILLING_PAYMENT_METHODS]: packageStubPage(
      "Payment methods",
      "The cards we can charge.",
      "PaymentDetails · StoredPaymentMethods",
      "payment-details · payment-gateways"
    ),
    // Legacy's two settings forms, saved as one (plan F4): currency and price
    // list above, invoice consolidation and its schedule below.
    [PAGE_KEY.BILLING_SETTINGS]: page(
      "Billing settings",
      "Preferences for how you are billed.",
      [
        panelRow(
          "How you are billed",
          "The currency you are quoted in, the list you buy from, and whether your invoices are consolidated into one.",
          moduleRef(FORM_MODULE_ID, {
            props: {
              schema: dataRef(DATA_REF_ID.BILLING_SETTINGS_FORM_SCHEMA),
              uischema: dataRef(DATA_REF_ID.BILLING_SETTINGS_FORM_UISCHEMA),
              model: dataRef(DATA_REF_ID.BILLING_SETTINGS_FORM_MODEL),
              submit: MOCK_ACTION.BILLING_SETTINGS_SAVE,
              submitLabel: "Save settings",
              resetLabel: "Cancel"
            }
          })
        )
      ]
    ),
    [PAGE_KEY.BILLING_CREDIT]: page(
      "Account credit",
      "Balance we apply before charging your card.",
      [
        panelRow(
          "Balances",
          "Applied automatically to new invoices, per currency.",
          billingList(
            DATA_REF_ID.WALLET_BALANCE_ITEMS,
            "No credit",
            WALLET_BALANCE_HEADINGS
          ),
          // Legacy's own top-up control (plan F12) — kept on screen and
          // disabled with its reason where the brand does not allow it.
          {
            actions: dataActions(
              DATA_REF_ID.WALLET_HEADER_ACTIONS,
              "Account credit"
            )
          }
        ),
        // Legacy's own credit-limit message over the panel
        // (`creditLimitSummaryMsg.vue:43-56`): what is left of the allowance,
        // toned by how much of it is, with the panel's own words — the
        // allowance and the ONE currency it may be spent in — under it.
        {
          layout: ROW_LAYOUT.FULL,
          visible: dataRef(DATA_REF_ID.WALLET_HAS_CREDIT_LIMIT),
          slots: [
            moduleRef(BANNER_MODULE_ID, {
              variant: BANNER_VARIANT.NOTICE,
              props: {
                title: dataRef(DATA_REF_ID.WALLET_CREDIT_SUMMARY),
                message: dataRef(DATA_REF_ID.WALLET_CREDIT_PANEL_COPY),
                tone: dataRef(DATA_REF_ID.WALLET_CREDIT_BANNER_TONE),
                label: "Credit limit",
                dismissLabel: "Dismiss"
              }
            })
          ]
        },
        // Only where the brand grants this client one; with no allowance there
        // is nothing to meter (content/types.ts `visible`).
        assign(
          panelRow(
            "Credit limit",
            "How far into credit this account may run, and what is left of it.",
            specSlot(
              DATA_REF_ID.WALLET_CREDIT_LIMIT_SPEC_ITEMS,
              "No credit limit"
            ),
            { actions: creditLimitMeter() }
          ),
          { visible: dataRef(DATA_REF_ID.WALLET_HAS_CREDIT_LIMIT) }
        ),
        // Legacy's own credit-statements listing, on the page rather than
        // behind its modal — shown where the brand grants an allowance, which
        // is the gate its "View credit statements" link hung off.
        assign(
          pagedPanelRow(
            "Credit statements",
            "Each period we have closed off, with the figures it settled on.",
            DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS,
            "No statements filed yet",
            {
              controls: panelControls(
                DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS,
                "credit statements",
                "Search by period"
              )
            },
            CREDIT_STATEMENT_HEADINGS
          ),
          { visible: dataRef(DATA_REF_ID.WALLET_HAS_CREDIT_STATEMENTS) }
        ),
        // A header-only band so the page explains the mechanism the figures
        // above obey. A panel, not the muted fill, which has no edge of its own
        // and sits a shade off the page's own ground.
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "How credit works",
            description:
              "Credit notes and top-ups add to your balance. Each new invoice draws it down first, and only the remainder is charged to your card."
          },
          slots: []
        }
      ]
    )
  };
}
