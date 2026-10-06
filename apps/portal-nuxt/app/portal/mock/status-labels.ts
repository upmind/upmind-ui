// -----------------------------------------------------------------------------
/**
 * @module portal/mock/status-labels
 * @description The wire enums, in the client's words and in the badge's tone
 * (plan R7). One table per enum, TOTAL over its members, so a status a seed
 * has never carried still renders as language rather than as a wire code.
 *
 * Read from both sides of the mock layer — the definitions word their filter
 * options with these, the selectors word their rows — so they live below both
 * rather than inside either.
 */

import {
  AffiliatePayoutDestinationCode,
  ContractStatusCodes,
  CreditNoteStatus,
  FraudStatus,
  InvoiceStatus,
  ScheduledActionStatusTypes,
  SentEmailStatus,
  TicketStatusCodes,
  WalletTransactionTypes
} from "@upmind-automation/types";
import {
  MOCK_COMMISSION_STATUS,
  MOCK_ORDER_STATUS,
  MOCK_PAYMENT_STATUS,
  MOCK_PAYOUT_STATUS
} from "./types";
import type {
  MockCommissionStatus,
  MockOrderStatus,
  MockPaymentStatus,
  MockPayoutStatus
} from "./types";
import type { BadgeVariants, TimelineIntent } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** The badge tone a status wears — the design system's own variants. */
export type StatusTone = BadgeVariants["variant"];

/** The marker tone a timeline event wears — a feed's own intent scale, not a badge's. */
export type TimelineTone = TimelineIntent;

export const INVOICE_STATUS_LABEL: Readonly<Record<InvoiceStatus, string>> = {
  [InvoiceStatus.ADJUSTED]: "Adjusted",
  [InvoiceStatus.CANCELLED]: "Cancelled",
  [InvoiceStatus.CANCELLATION_REQUEST]: "Cancellation requested",
  [InvoiceStatus.DRAFT]: "Draft",
  [InvoiceStatus.OVERDUE]: "Overdue",
  [InvoiceStatus.PAID]: "Paid",
  [InvoiceStatus.REFUNDED]: "Refunded",
  [InvoiceStatus.REPLACED]: "Replaced",
  [InvoiceStatus.UNPAID]: "Unpaid"
};

/** What is still owed reads as a warning; what is overdue as a danger; what is settled or written off is quiet. */
export const INVOICE_STATUS_TONE: Readonly<Record<InvoiceStatus, StatusTone>> =
  {
    [InvoiceStatus.ADJUSTED]: "warning",
    [InvoiceStatus.CANCELLED]: "neutral",
    [InvoiceStatus.CANCELLATION_REQUEST]: "warning",
    [InvoiceStatus.DRAFT]: "neutral",
    [InvoiceStatus.OVERDUE]: "danger",
    [InvoiceStatus.PAID]: "success",
    [InvoiceStatus.REFUNDED]: "neutral",
    [InvoiceStatus.REPLACED]: "neutral",
    [InvoiceStatus.UNPAID]: "warning"
  };

export const PRODUCT_STATUS_LABEL: Readonly<
  Record<ContractStatusCodes, string>
> = {
  [ContractStatusCodes.ACTIVE]: "Active",
  [ContractStatusCodes.AWAITING_ACTIVATION]: "Awaiting setup",
  [ContractStatusCodes.CANCELLED]: "Cancelled",
  [ContractStatusCodes.CLOSED]: "Closed",
  [ContractStatusCodes.FRAUD]: "On hold",
  [ContractStatusCodes.PENDING]: "Pending",
  [ContractStatusCodes.SUSPENDED]: "Suspended"
};

/** A running product is quietly good; one waiting on the client is a warning; a suspended one is a danger; a past one is neutral. */
export const PRODUCT_STATUS_TONE: Readonly<
  Record<ContractStatusCodes, StatusTone>
> = {
  [ContractStatusCodes.ACTIVE]: "success",
  [ContractStatusCodes.AWAITING_ACTIVATION]: "warning",
  [ContractStatusCodes.CANCELLED]: "neutral",
  [ContractStatusCodes.CLOSED]: "neutral",
  [ContractStatusCodes.FRAUD]: "danger",
  [ContractStatusCodes.PENDING]: "warning",
  [ContractStatusCodes.SUSPENDED]: "danger"
};

export const TICKET_STATUS_LABEL: Readonly<Record<TicketStatusCodes, string>> =
  {
    [TicketStatusCodes.AWAITING_RESPONSE]: "Awaiting response",
    [TicketStatusCodes.CLIENT_REPLIED]: "You replied",
    [TicketStatusCodes.CLOSED]: "Closed",
    [TicketStatusCodes.IN_PROGRESS]: "In progress",
    [TicketStatusCodes.OPEN]: "Open",
    [TicketStatusCodes.SCHEDULED]: "Scheduled"
  };

/** A thread waiting on the team reads open; one waiting on the client reads as a prompt; a finished one is quiet. */
export const TICKET_STATUS_TONE: Readonly<
  Record<TicketStatusCodes, StatusTone>
> = {
  [TicketStatusCodes.AWAITING_RESPONSE]: "warning",
  [TicketStatusCodes.CLIENT_REPLIED]: "info",
  [TicketStatusCodes.CLOSED]: "neutral",
  [TicketStatusCodes.IN_PROGRESS]: "info",
  [TicketStatusCodes.OPEN]: "info",
  [TicketStatusCodes.SCHEDULED]: "warning"
};

/**
 * A credit note's standing: allocated where the note says so, unallocated
 * until it does — an ABSENT status reads as a credit not yet applied to
 * anything. ONE reading: the panel that narrows by it and the row that prints
 * it were answering the same question twice.
 */
export function creditNoteState(note: {
  readonly status?: CreditNoteStatus;
}): CreditNoteStatus {
  return note.status ?? CreditNoteStatus.UNALLOCATED;
}

export const CREDIT_NOTE_STATUS_LABEL: Readonly<
  Record<CreditNoteStatus, string>
> = {
  [CreditNoteStatus.ALLOCATED]: "Allocated",
  [CreditNoteStatus.UNALLOCATED]: "Unallocated"
};

/** A credit still to be spent is worth noticing; one already applied is a record. */
export const CREDIT_NOTE_STATUS_TONE: Readonly<
  Record<CreditNoteStatus, StatusTone>
> = {
  [CreditNoteStatus.ALLOCATED]: "neutral",
  [CreditNoteStatus.UNALLOCATED]: "info"
};

export const FRAUD_STATUS_LABEL: Readonly<Record<FraudStatus, string>> = {
  [FraudStatus.NOT_FRAUD]: "Cleared",
  [FraudStatus.REVIEW]: "Under review",
  [FraudStatus.FRAUD]: "Flagged"
};

export const ORDER_STATUS_LABEL: Readonly<Record<MockOrderStatus, string>> = {
  [MOCK_ORDER_STATUS.PENDING]: "Pending",
  [MOCK_ORDER_STATUS.PROCESSING]: "Processing",
  [MOCK_ORDER_STATUS.ACTIVE]: "Active",
  [MOCK_ORDER_STATUS.CANCELLED]: "Cancelled"
};

export const PAYMENT_STATUS_LABEL: Readonly<Record<MockPaymentStatus, string>> =
  {
    [MOCK_PAYMENT_STATUS.PENDING]: "Pending",
    [MOCK_PAYMENT_STATUS.SUCCESSFUL]: "Received",
    [MOCK_PAYMENT_STATUS.FAILED]: "Failed"
  };

/** Money on its way is worth noticing; money arrived is settled; money refused is an error. */
export const PAYMENT_STATUS_TONE: Readonly<
  Record<MockPaymentStatus, StatusTone>
> = {
  [MOCK_PAYMENT_STATUS.PENDING]: "warning",
  [MOCK_PAYMENT_STATUS.SUCCESSFUL]: "success",
  [MOCK_PAYMENT_STATUS.FAILED]: "danger"
};

/** What the brand has standing against a product, in the client's words — legacy's automation timeline. */
export const SCHEDULED_ACTION_STATUS_LABEL: Readonly<
  Record<ScheduledActionStatusTypes, string>
> = {
  [ScheduledActionStatusTypes.STATUS_CANCELLED]: "Called off",
  [ScheduledActionStatusTypes.STATUS_EXECUTED]: "Done",
  [ScheduledActionStatusTypes.STATUS_OVERRIDDEN]: "Replaced",
  [ScheduledActionStatusTypes.STATUS_REVERTED]: "Undone",
  [ScheduledActionStatusTypes.STATUS_SCHEDULED]: "Scheduled"
};

/** What is still coming is worth watching; what has happened is settled; what was called off is a record. */
export const SCHEDULED_ACTION_STATUS_TONE: Readonly<
  Record<ScheduledActionStatusTypes, TimelineTone>
> = {
  [ScheduledActionStatusTypes.STATUS_CANCELLED]: "default",
  [ScheduledActionStatusTypes.STATUS_EXECUTED]: "success",
  [ScheduledActionStatusTypes.STATUS_OVERRIDDEN]: "default",
  [ScheduledActionStatusTypes.STATUS_REVERTED]: "default",
  [ScheduledActionStatusTypes.STATUS_SCHEDULED]: "info"
};

/** The wallet ledger's movement types, in the client's words — legacy's credit statement rows. */
export const WALLET_TRANSACTION_TYPE_LABEL: Readonly<
  Record<WalletTransactionTypes, string>
> = {
  [WalletTransactionTypes.ADD]: "Top-up",
  [WalletTransactionTypes.SPEND]: "Applied to invoice",
  [WalletTransactionTypes.REFUND_TO_WALLET]: "Refund to credit",
  [WalletTransactionTypes.REFUND_TO_GATEWAY]: "Refund to card",
  [WalletTransactionTypes.WITHDRAW]: "Withdrawal",
  [WalletTransactionTypes.OVERPAID_CREDIT_NOTE]: "Overpayment credited",
  [WalletTransactionTypes.REFUND_FROM_WALLET]: "Refund from credit"
};

/** How an email's outcome reads — legacy's own word for the ERROR state is "Failed". */
export const SENT_EMAIL_STATUS_LABEL: Readonly<
  Record<SentEmailStatus, string>
> = {
  [SentEmailStatus.SENT]: "Sent",
  [SentEmailStatus.BOUNCED]: "Bounced",
  [SentEmailStatus.ERROR]: "Failed",
  [SentEmailStatus.SENDING]: "Sending"
};

/** Delivered is settled; bounced is worth noticing; failed never left. */
export const SENT_EMAIL_STATUS_TONE: Readonly<
  Record<SentEmailStatus, StatusTone>
> = {
  [SentEmailStatus.SENT]: "success",
  [SentEmailStatus.BOUNCED]: "warning",
  [SentEmailStatus.ERROR]: "danger",
  [SentEmailStatus.SENDING]: "neutral"
};

/** Where an affiliate's earnings are sent, in the client's words. */
export const PAYOUT_DESTINATION_LABEL: Readonly<
  Record<AffiliatePayoutDestinationCode, string>
> = {
  [AffiliatePayoutDestinationCode.WALLET]: "Account credit",
  [AffiliatePayoutDestinationCode.OFFLINE]: "Bank transfer",
  [AffiliatePayoutDestinationCode.PAYPAL]: "PayPal"
};

/** How a transfer went, in the client's words. */
export const PAYOUT_STATUS_LABEL: Readonly<Record<MockPayoutStatus, string>> = {
  [MOCK_PAYOUT_STATUS.PENDING]: "Pending",
  [MOCK_PAYOUT_STATUS.PAID]: "Paid",
  [MOCK_PAYOUT_STATUS.FAILED]: "Failed"
};

/** Money on its way is worth watching; money arrived is settled; money returned is an error. */
export const PAYOUT_STATUS_TONE: Readonly<
  Record<MockPayoutStatus, StatusTone>
> = {
  [MOCK_PAYOUT_STATUS.PENDING]: "warning",
  [MOCK_PAYOUT_STATUS.PAID]: "success",
  [MOCK_PAYOUT_STATUS.FAILED]: "danger"
};

/**
 * The tone a commission's AMOUNT wears — legacy's `commissionAmountTag`
 * (`commissionAmountTag.vue:45-58`): what was refused reads danger, what is
 * still being decided reads warning, what is held reads quiet, and what was
 * approved reads success.
 */
export const COMMISSION_STATUS_TONE: Readonly<
  Record<MockCommissionStatus, StatusTone>
> = {
  [MOCK_COMMISSION_STATUS.REJECTED]: "danger",
  [MOCK_COMMISSION_STATUS.AWAITING_PAYMENT]: "warning",
  [MOCK_COMMISSION_STATUS.PENDING_APPROVAL]: "warning",
  [MOCK_COMMISSION_STATUS.ON_HOLD]: "neutral",
  [MOCK_COMMISSION_STATUS.CANCELLED]: "danger",
  [MOCK_COMMISSION_STATUS.APPROVED]: "success"
};
