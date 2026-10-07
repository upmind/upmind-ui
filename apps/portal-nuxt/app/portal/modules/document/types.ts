// -----------------------------------------------------------------------------
/**
 * @module portal/modules/document/types
 * @description Prop contract for the `document` module — a whole billing
 * document (legacy's invoice and credit-note views): its header, the two
 * parties, what it charges for, what it comes to, what has been paid against
 * it, and what it says about itself. Over `@upmind/ui`'s `Heading`,
 * `DescriptionList`, `Table` and `Separator`.
 *
 * Every money field is a display STRING: the mock layer is the server, and it
 * hands the figures over already worded (plan R6). The module renders; it
 * neither computes nor decides.
 */

import type { AlertProps, BadgeVariants } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** A badge on the document — its own status, or a payment's. */
export type DocumentModuleBadge = {
  readonly label: string;
  readonly tone: BadgeVariants["variant"];
};

/** One column heading of the document's tables, in render order. */
export type DocumentModuleHeading = {
  readonly label: string;
  /** Right-aligned tabular figures — quantities, rates, amounts. */
  readonly numeric?: boolean;
};

/** One labelled date under the document's number ("Issued", "Due", "Paid"). */
export type DocumentModuleDate = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
};

export type DocumentModuleHeader = {
  /** What KIND of document this is — "Invoice", "Proforma", "Credit note". */
  readonly title: string;
  readonly number: string;
  readonly status?: DocumentModuleBadge;
  readonly dates: readonly DocumentModuleDate[];
};

/** One side of the party block — who raised it, and who it was raised for. */
export type DocumentModulePartyBlock = {
  /** Which side this is, in the reader's words ("From", "Billed to"). */
  readonly label: string;
  readonly name: string;
  readonly company?: string;
  readonly taxNumber?: string;
  readonly registrationNumber?: string;
  readonly lines: readonly string[];
};

export type DocumentModuleParty = {
  readonly brand: DocumentModulePartyBlock;
  readonly client: DocumentModulePartyBlock;
};

export type DocumentModuleLine = {
  readonly id: string;
  readonly description: string;
  /** How many, already worded; absent leaves the column blank on this row. */
  readonly quantity?: string;
  /** What one costs, already worded. */
  readonly unit?: string;
  readonly amount: string;
};

/** One row of the totals block — a label and the figure beside it. */
export type DocumentModuleTotal = {
  readonly label: string;
  readonly value: string;
};

export type DocumentModuleTotals = {
  readonly subtotal: DocumentModuleTotal;
  /** One row per tax band, each already carrying its rate in the label. */
  readonly taxes: readonly DocumentModuleTotal[];
  readonly discount?: DocumentModuleTotal;
  readonly total: DocumentModuleTotal;
  readonly paid: DocumentModuleTotal;
  /** What is still owed — the figure the document is really about. */
  readonly balance: DocumentModuleTotal;
};

export type DocumentModulePayment = {
  readonly id: string;
  readonly date: string;
  readonly method: string;
  readonly amount: string;
  readonly status: DocumentModuleBadge;
};

/** A notice about the document — its status, a payment in flight, which card renews it. */
export type DocumentModuleMessage = {
  readonly id: string;
  readonly tone?: AlertProps["variant"];
  readonly title?: string;
  readonly message: string;
  /**
   * A control beside the notice (legacy's "View payment instructions").
   * Selecting it emits `select` with this action's own value; the module
   * renders, it does not decide.
   */
  readonly action?: {
    readonly value: string;
    readonly label: string;
  };
};

/** How prominently a document action reads — the document's own three weights. */
export const DOCUMENT_ACTION_VARIANT = {
  PRIMARY: "primary",
  OUTLINE: "outline",
  GHOST: "ghost"
} as const;

export type DocumentActionVariant =
  (typeof DOCUMENT_ACTION_VARIANT)[keyof typeof DOCUMENT_ACTION_VARIANT];

export type DocumentModuleAction = {
  readonly value: string;
  readonly label: string;
  readonly variant?: DocumentActionVariant;
  /**
   * Alternatives to the control itself — present, the control opens a menu of
   * them and its own `value` is never emitted. Legacy's Pay carried the
   * currencies it could be settled in this way (`invoiceStatusMsg`).
   */
  readonly options?: readonly {
    readonly value: string;
    readonly label: string;
  }[];
};

export const DOCUMENT_MODULE_VARIANT = {
  /** On screen, inside the page's own panel. */
  DEFAULT: "default",
  /** On paper: the document stands alone on white, with its own rules and no chrome. */
  PRINT: "print"
} as const;

export type DocumentModuleVariant =
  (typeof DOCUMENT_MODULE_VARIANT)[keyof typeof DOCUMENT_MODULE_VARIANT];

export type DocumentModuleProps = {
  /** The registered module variant (registry.ts). Absent = `default`. */
  readonly variant?: DocumentModuleVariant;
  /** Absent means the route named no document at all — the empty state renders instead. */
  readonly header?: DocumentModuleHeader;
  readonly party?: DocumentModuleParty;
  readonly lines?: readonly DocumentModuleLine[];
  /**
   * Past this many rows the lines table collapses behind a control (legacy
   * `invoiceItems.vue:502-510`, `itemCap`). Absent renders every line.
   */
  readonly lineCap?: number;
  /** The collapse control's labels; `{n}` is the hidden count. No English default (CC22). */
  readonly showMoreLinesLabel?: string;
  readonly showLessLinesLabel?: string;
  readonly totals?: DocumentModuleTotals;
  /**
   * Stamped across the amount-due block when the document is settled —
   * legacy's `invoicePaidStamp` (`invoiceItems.vue:279`). The WORD is data:
   * no English default (CC22), and an absent one stamps nothing.
   */
  readonly paidStamp?: string;
  /**
   * The labelled facts printed under the totals — legacy's own footer well
   * (`invoiceDetails.vue:161-184`), which a document with none omits
   * entirely. Each entry is a term and the value beside it.
   */
  readonly details?: readonly DocumentModuleTotal[];
  readonly payments?: readonly DocumentModulePayment[];
  readonly messages?: readonly DocumentModuleMessage[];
  readonly actions?: readonly DocumentModuleAction[];
  /** The lines table's column headings, in render order. No English default (CC22). */
  readonly lineHeadings: readonly DocumentModuleHeading[];
  /** The payments table's column headings, in render order. No English default (CC22). */
  readonly paymentHeadings: readonly DocumentModuleHeading[];
  /** The payments block's own heading. No English default (CC22). */
  readonly paymentsTitle: string;
  /** Heading shown when the route names no document. No English default (CC22). */
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
};

export type DocumentModuleEmits = {
  select: [value: string];
};
