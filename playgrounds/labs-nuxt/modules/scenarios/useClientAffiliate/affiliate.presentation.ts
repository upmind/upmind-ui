// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientAffiliate/affiliate.presentation
 * @description How the client's affiliate area DRAWS — one declaration per
 * panel of the three tabs, mirroring the legacy client area
 * (`vue-app/src/views/client/account/affiliate/`): Overview (the account's stats
 * grid, its links and its referrals), Commissions (the withdrawal and the
 * commission history) and Payouts (the destination editor and the payout
 * history).
 *
 * Grounded field by field on the rows the composables publish: the raw wire
 * rows of `useAffiliateLinks` / `useAffiliateReferrals` /
 * `useAffiliateCommissions` (`affiliate.types.ts`, `packages/types`), and the
 * MAPPED `AffiliatePayoutRow` of `useAffiliatePayouts`. Ordering, filtering and
 * paging are not here at all (`R6-28`): each collection publishes its own
 * criteria schema, sort enum and pagination descriptor, and the surface reads
 * them directly.
 *
 * Excluded on purpose, echoed for overrule: `hash` (inside `referral_url`),
 * `affiliate_account_id` and every other `*_id` (system ids), `updated_at`
 * (a duplicate date), `paymentLog` (an object — the legacy shows it in a modal).
 */

import {
  ActionPlacementTypes,
  CardSlotTypes,
  RecordActionColorTypes,
  RecordActionPlacementTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import type {
  ActionsUischema,
  CardUischema,
  RecordUischema,
  TableBadge,
  TableCell,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const REFRESH_FEEDBACK = {
  success: "labs.affiliate_refreshed",
  failure: "labs.affiliate_refresh_failed"
};

/** The refresh every collection panel offers in its header. */
const refreshAction = {
  type: "Action",
  name: "refresh",
  i18n: "action.refresh",
  icon: "refresh-cw-01",
  variant: "outline",
  placement: ActionPlacementTypes.HEADER,
  feedback: REFRESH_FEEDBACK
} as const;

/** The balance a stat reads — `<kind>.ALL.amount_formatted` on the balances read. */
const balanceScope = (kind: string): string =>
  `#/properties/balances/properties/${kind}/properties/ALL/properties/amount_formatted`;

// -----------------------------------------------------------------------------
// P1 `account` — the account, as a record

const accountStats: TableCell[] = [
  {
    type: "TableCellDate",
    scope: "#/properties/data/properties/created_at",
    i18n: "labs.affiliate_since",
    options: { width: TableColumnWidthTypes.SIXTH }
  },
  {
    type: "TableCellText",
    scope: "#/properties/data/properties/link_visit_count",
    i18n: "labs.affiliate_visits",
    options: { width: TableColumnWidthTypes.SIXTH }
  },
  {
    type: "TableCellText",
    scope: "#/properties/data/properties/referral_count",
    i18n: "labs.affiliate_referrals",
    options: { width: TableColumnWidthTypes.SIXTH }
  },
  {
    type: "TableCellText",
    scope: balanceScope("pending_balance"),
    i18n: "labs.affiliate_balance_pending",
    options: { width: TableColumnWidthTypes.SIXTH }
  },
  {
    type: "TableCellText",
    scope: balanceScope("balance"),
    i18n: "labs.affiliate_balance_available",
    options: { width: TableColumnWidthTypes.SIXTH }
  },
  {
    type: "TableCellText",
    scope: balanceScope("withdrawn_balance"),
    i18n: "labs.affiliate_balance_withdrawn",
    options: { width: TableColumnWidthTypes.SIXTH }
  }
];

/**
 * The record is the BRAND the account sits under, with the account and its
 * balances folded in beside it: `brand` is published whether or not the client
 * is enrolled (`useClientAffiliate.context.ts`), so the page still draws —
 * with its onboarding notice and the Enrol control — for a client with no
 * account data, where `data` alone would leave the record empty.
 */
export const accountRecord: RecordUischema = {
  type: "RecordLayout",
  record: "brand",
  siblings: ["data", "balances"],
  header: {
    title: "#/properties/name",
    badges: [
      { flag: "isEnrolled", i18n: "labs.affiliate_enrolled" },
      { flag: "isDisabled", i18n: "labs.affiliate_disabled", color: "danger" },
      { flag: "isStaged", i18n: "labs.affiliate_staged", color: "warning" }
    ] satisfies TableBadge[],
    lead: [
      {
        name: "disabled",
        gate: "isDisabled",
        i18n: {
          title: "labs.affiliate_disabled_title",
          text: "labs.affiliate_disabled_text"
        },
        variant: "danger"
      },
      {
        name: "staged",
        gate: "isStaged",
        i18n: {
          title: "labs.affiliate_staged_title",
          text: "labs.affiliate_staged_text"
        },
        variant: "warning"
      },
      {
        name: "onboarding",
        gate: "!isEnrolled",
        i18n: {
          title: "labs.affiliate_not_enrolled_title",
          text: "labs.affiliate_not_enrolled_text"
        }
      }
    ]
  },
  sections: [
    {
      kind: "fields",
      key: "stats",
      elements: accountStats
    }
  ],
  actions: [
    {
      name: "enrol",
      i18n: "labs.affiliate_enrol",
      icon: "plus",
      gate: "!isEnrolled",
      busy: "isProcessing",
      run: "enrol"
    },
    {
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      placement: RecordActionPlacementTypes.UTILITY,
      run: "refresh"
    },
    {
      name: "reset",
      i18n: "action.reset",
      icon: "x-close",
      placement: RecordActionPlacementTypes.UTILITY,
      run: "reset"
    }
  ]
};

// -----------------------------------------------------------------------------
// P2 `links` — the client's referral links

export const linksTable: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "labs.affiliate_col_name",
      options: { width: TableColumnWidthTypes.SIXTH }
    },
    {
      type: "TableCellText",
      scope: "#/properties/referral_url",
      i18n: "labs.affiliate_col_referral_url",
      options: { width: TableColumnWidthTypes.FIVE_TWELFTHS }
    },
    {
      type: "TableCellText",
      scope: "#/properties/redirect_url",
      i18n: "labs.affiliate_col_redirect_url",
      options: { width: TableColumnWidthTypes.THIRD }
    },
    {
      type: "TableCellText",
      scope: "#/properties/visit_count",
      i18n: "labs.affiliate_col_visits",
      options: { width: TableColumnWidthTypes.TWELFTH }
    },
    {
      type: "TableCellText",
      scope: "#/properties/referral_count",
      i18n: "labs.affiliate_col_referrals",
      options: { width: TableColumnWidthTypes.TWELFTH }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/created_at",
      i18n: "labs.affiliate_col_created"
    }
  ]
};

export const linksCard: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "labs.affiliate_col_name",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/referral_url",
      i18n: "labs.affiliate_col_referral_url",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/redirect_url",
      i18n: "labs.affiliate_col_redirect_url",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/visit_count",
      i18n: "labs.affiliate_col_visits",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/referral_count",
      i18n: "labs.affiliate_col_referrals",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/created_at",
      i18n: "labs.affiliate_col_created",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/**
 * `add` carries no row and opens a fresh editor; `edit` opens the editor on the
 * row's own record (`record.from`, `.withId`). A raw link row carries no `meta`,
 * so no control is gated per row — every listed link is the client's own.
 */
export const linksActions: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "add",
      handoff: "add",
      i18n: "action.add_new",
      icon: "plus",
      variant: "primary",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      name: "edit",
      handoff: "edit",
      i18n: "action.edit",
      icon: "edit-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "remove",
      i18n: "action.remove",
      icon: "trash-01",
      variant: "danger",
      placement: ActionPlacementTypes.OVERFLOW,
      feedback: {
        success: "labs.affiliate_link_removed",
        failure: "labs.affiliate_link_remove_failed"
      }
    },
    refreshAction
  ]
};

// -----------------------------------------------------------------------------
// P3 `referrals` — who the links brought in

export const referralsTable: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/client/properties/fullname",
      i18n: "labs.affiliate_referral"
    },
    {
      type: "TableCellText",
      scope: "#/properties/affiliate_link/properties/name",
      i18n: "labs.affiliate_referred_via"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/created_at",
      i18n: "labs.affiliate_referred_on"
    }
  ]
};

export const referralsCard: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/client/properties/fullname",
      i18n: "labs.affiliate_referral",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/affiliate_link/properties/name",
      i18n: "labs.affiliate_referred_via",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/created_at",
      i18n: "labs.affiliate_referred_on",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/** Read-only collections offer the refresh and nothing else. */
export const refreshOnlyActions: ActionsUischema = {
  type: "ActionsLayout",
  elements: [refreshAction]
};

// -----------------------------------------------------------------------------
// P4 `withdrawal` — the available balance and the request to withdraw it

export const withdrawalRecord: RecordUischema = {
  type: "RecordLayout",
  record: "balances",
  header: {
    titleI18n: "labs.affiliate_withdrawals",
    badges: [{ flag: "canWithdraw", i18n: "labs.affiliate_withdrawals_open" }],
    lead: [
      {
        name: "unavailable",
        gate: "!canWithdraw",
        i18n: {
          title: "labs.affiliate_withdraw_unavailable_title",
          text: "labs.affiliate_withdraw_unavailable_text"
        }
      }
    ]
  },
  sections: [
    {
      kind: "fields",
      key: "balance",
      elements: [
        {
          type: "TableCellText",
          scope:
            "#/properties/balance/properties/ALL/properties/amount_formatted",
          i18n: "labs.affiliate_balance_available",
          options: { width: TableColumnWidthTypes.HALF }
        }
      ]
    }
  ],
  actions: [
    {
      name: "requestWithdrawal",
      i18n: "labs.affiliate_request_withdrawal",
      icon: "wallet-01",
      color: RecordActionColorTypes.PRIMARY,
      gate: "canWithdraw",
      busy: "isProcessing",
      form: {
        context: "withdrawal",
        submit: "requestWithdrawal",
        args: ["#"],
        i18n: "labs.affiliate_request_withdrawal",
        submitI18n: "labs.affiliate_send_request"
      }
    }
  ]
};

// -----------------------------------------------------------------------------
// P5 `commissions` — the commission history

/**
 * A commission row carries four raw booleans, not one derived status — the
 * module exports the legacy derivation only as utilities, which a table cell
 * cannot call — so each flag draws as its own badge. The flags live on the ROW
 * rather than under a `meta` object, so each badge names its own scope, and the
 * cell borrows the first flag's scope only for its column identity.
 */
const COMMISSION_BADGES: TableBadge[] = [
  {
    flag: "commission_approved",
    scope: "#/properties/commission_approved",
    i18n: "labs.affiliate_commission_approved",
    color: "success"
  },
  {
    flag: "invoice_paid",
    scope: "#/properties/invoice_paid",
    i18n: "labs.affiliate_invoice_paid"
  },
  {
    flag: "suspended",
    scope: "#/properties/suspended",
    i18n: "labs.affiliate_commission_suspended",
    color: "warning"
  },
  {
    flag: "rejected",
    scope: "#/properties/rejected",
    i18n: "labs.affiliate_commission_rejected",
    color: "danger"
  }
];

const COMMISSION_STATUS_SCOPE = "#/properties/commission_approved";

export const commissionsTable: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/amount_converted_formatted",
      i18n: "labs.affiliate_amount",
      options: { width: TableColumnWidthTypes.SIXTH }
    },
    {
      type: "TableCellText",
      scope: "#/properties/product_name",
      i18n: "text.item",
      options: { width: TableColumnWidthTypes.THIRD }
    },
    {
      type: "TableCellText",
      scope: "#/properties/invoice/properties/number",
      i18n: "labs.affiliate_invoice",
      options: { width: TableColumnWidthTypes.SIXTH }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/created_at",
      i18n: "text.date_added"
    },
    {
      type: "TableCellBadges",
      scope: COMMISSION_STATUS_SCOPE,
      i18n: "text.status",
      options: { badges: COMMISSION_BADGES }
    }
  ]
};

export const commissionsCard: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/amount_converted_formatted",
      i18n: "labs.affiliate_amount",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/product_name",
      i18n: "text.item",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/invoice/properties/number",
      i18n: "labs.affiliate_invoice",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/created_at",
      i18n: "text.date_added",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellBadges",
      scope: COMMISSION_STATUS_SCOPE,
      i18n: "text.status",
      options: { badges: COMMISSION_BADGES, slot: CardSlotTypes.BODY }
    }
  ]
};

// -----------------------------------------------------------------------------
// P7 `payouts` — the payout history, on the mapped `AffiliatePayoutRow`

export const payoutsTable: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/amountFormatted",
      i18n: "labs.affiliate_amount"
    },
    {
      type: "TableCellText",
      scope: "#/properties/destinationName",
      i18n: "labs.affiliate_destination"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/createdAt",
      i18n: "labs.affiliate_date_paid"
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/success",
      i18n: "labs.affiliate_paid",
      options: { icon: "check-circle" }
    }
  ]
};

export const payoutsCard: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/amountFormatted",
      i18n: "labs.affiliate_amount",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/destinationName",
      i18n: "labs.affiliate_destination",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/createdAt",
      i18n: "labs.affiliate_date_paid",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/success",
      i18n: "labs.affiliate_paid",
      options: { icon: "check-circle", slot: CardSlotTypes.BODY }
    }
  ]
};
