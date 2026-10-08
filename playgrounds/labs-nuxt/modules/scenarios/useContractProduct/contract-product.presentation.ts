// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContractProduct/contract-product.presentation
 * @description How one contract product DRAWS as a record on the shared record
 * surface: its name, its status, its node flags, its declared fields, every
 * write and where each sits.
 *
 * Cancellation and consolidation open the manager's OWN context slot
 * (`cancellation` / `consolidation`), which the open transition fills — so
 * stop-renewing and schedule-cancellation are the cancellation form's options.
 * Upgrade / Downgrade navigates to the `?init=upgrade` overlay this page hosts.
 *
 * The fields are legacy's (`cProdDetailsTable.vue`, `cProdRowItem.vue`,
 * `cProdBreakdown.vue`), each cited where it is declared, read off the mapped
 * record and — where the mapper keeps a value only on its `raw` — off that.
 * A field with no value is not drawn, and a section with none is not drawn.
 *
 * Next due date is drawn only for a SUBSCRIPTION. Legacy gates the row on
 * `isSubscription` (`vue-app/src/components/app/global/contractProducts/
 * cProdDetailsTable.vue:65`), where a subscription is a recurring product —
 * `billing_cycle_months > 0` (`cProdRowItem.vue:312`), the rule the mapper
 * records as `isSubscription` (`packages/headless/src/modules/contract-product/
 * contract-product.mappers.ts:274`).
 */

import { RuleEffect } from "@jsonforms/core";
import {
  ContractProductFormTypes,
  QUERY_PARAMS,
  ScopeActorTypes,
  TicketsContextTypes,
  useContractProducts,
  useTickets
} from "@upmind-automation/headless";
import {
  RecordActionColorTypes,
  RecordActionPlacementTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import { contractSummary } from "../useContract/contract.summary";
import { ticketSummary } from "../useTicket/ticket.summary";
import { contractProductSummary } from "./contract-product.summary";
import type {
  RecordFormDeclaration,
  RecordUischema,
  TableCell
} from "../runtime/scenario.types";
import type { VerticalLayout } from "@jsonforms/core";
import { InitIntent } from "~/funnels/labs.constants";

export { contractProductSummary } from "./contract-product.summary";

// -----------------------------------------------------------------------------

const SUBSCRIPTION = {
  effect: RuleEffect.SHOW,
  condition: { scope: "#/properties/isSubscription", schema: { const: true } }
};

const RAW = "#/properties/raw/properties";

/** How the product is billed and renews. */
export const contractProductBilling: TableCell[] = [
  // cProdDetailsTable.vue:63-67 — the term, for a subscription only.
  {
    type: "TableCellText",
    scope: "#/properties/billingCycle",
    i18n: "text.billing_cycle",
    rule: SUBSCRIPTION
  },
  // cProdDetailsTable.vue:112-120 — price for a subscription, else total.
  {
    type: "TableCellText",
    scope: "#/properties/priceFormatted",
    i18n: "text.price"
  },
  {
    type: "TableCellText",
    scope: `${RAW}/configuration_total_discount_amount_formatted`,
    i18n: "text.discount",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: `${RAW}/discount_amount`,
        schema: { type: "number", exclusiveMinimum: 0 }
      }
    }
  },
  // cProdDetailsTable.vue:86-108 — renews (or is renewed by) the next due date.
  {
    type: "TableCellDate",
    scope: "#/properties/dateNextDue",
    i18n: "text.next_due_date",
    rule: SUBSCRIPTION
  },
  // cProdDetailsTable.vue:73-84 — an auto-expiring product cancels on this date.
  {
    type: "TableCellDate",
    scope: "#/properties/dateCalculatedCancel",
    i18n: "labs.record_cancels_on",
    rule: {
      effect: RuleEffect.SHOW,
      condition: { scope: "#/properties/renew", schema: { const: false } }
    }
  },
  // cProdDetailsTable.vue:69-108 (renewal state), cProdInvoiceConsolidationComp.vue:76-78.
  {
    type: "TableCellBadges",
    scope: "#/properties/raw",
    i18n: "labs.record_renewal",
    options: {
      width: TableColumnWidthTypes.HALF,
      badges: [
        { flag: "renew", i18n: "labs.record_auto_renew" },
        {
          flag: "auto_create_renew_invoice",
          i18n: "labs.record_renew_invoice"
        },
        {
          flag: "invoice_consolidation_enabled_calculated",
          i18n: "labs.record_consolidated"
        },
        { flag: "is_provisioned", i18n: "labs.record_provisioned" },
        {
          flag: "provision_setup_fields_confirmed",
          i18n: "labs.record_setup_confirmed"
        }
      ]
    }
  }
];

/** The options and attributes chosen with the product — cProdBreakdown.vue:162-163, 287-288. */
export const contractProductOptions: TableCell[] = [
  {
    type: "TableCellList",
    scope: `${RAW}/options`,
    i18n: "labs.record_options",
    options: {
      width: TableColumnWidthTypes.FULL,
      elements: [
        {
          type: "TableCellText",
          scope: "#/properties/product/properties/name",
          i18n: "labs.record_options"
        }
      ]
    }
  },
  {
    type: "TableCellList",
    scope: `${RAW}/attributes`,
    i18n: "labs.record_attributes",
    options: {
      width: TableColumnWidthTypes.FULL,
      elements: [
        {
          type: "TableCellText",
          scope: "#/properties/product/properties/name",
          i18n: "labs.record_attributes"
        }
      ]
    }
  }
];

/** The raised invoice's id on the model — set once a write that raises one has settled. */
const ISSUED_INVOICE_ID = "#/properties/issuedInvoice/properties/id";

/** The one-checkbox form that turns renewal invoicing `on` (`true`) or off (`false`); the read-only default is what a submit sends. */
function autoRenewForm(on: boolean): RecordFormDeclaration {
  return {
    schema: {
      type: "object",
      properties: { on: { type: "boolean", default: on } }
    },
    uischema: {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/on",
          i18n: "labs.contract_product_auto_renew_field",
          options: { readonly: true }
        }
      ]
    } satisfies VerticalLayout,
    submit: "setAutoRenew",
    args: ["#/properties/on"],
    submitI18n: "action.confirm"
  };
}

/** The contract product, drawn whole as one record. */
export const contractProductRecord: RecordUischema = {
  type: "RecordLayout",
  record: "contractProduct",
  siblings: ["issuedInvoice"],
  header: {
    title: "#/properties/title",
    status: "#/properties/status/properties/name",
    badges: [
      { flag: "isOnTrial", i18n: "labs.contract_product_meta_on_trial" },
      {
        flag: "isOnTerminatingTrial",
        i18n: "labs.contract_product_meta_trial_ending"
      },
      {
        flag: "isDelegatedAccess",
        i18n: "labs.contract_product_meta_delegated"
      },
      {
        flag: "isSetupIncomplete",
        i18n: "labs.contract_product_meta_setup_incomplete"
      },
      { flag: "isFraud", i18n: "labs.contract_product_meta_fraud" },
      { flag: "isImported", i18n: "labs.contract_product_meta_imported" },
      { flag: "hasMoved", i18n: "labs.contract_product_meta_moved" },
      {
        flag: "hasUnpaidRecurringInvoices",
        i18n: "labs.contract_product_unpaid_invoices"
      }
    ]
  },
  sections: [
    {
      kind: "alert",
      key: "renewal",
      alerts: [
        {
          // cProdProvider.vue:571-575 — the next invoice is a late renewal when its date is not in the future.
          /**
           * @decision
           * what: the notice opens on a two-flag gate array.
           * why: a record notice takes only `gate` (a string or an array); it has no
           *   uischema `rule`, and the playground engine is frozen.
           * rejected: a single `isLateRenewal` meta flag (a headless change, out of scope).
           */
          name: "late-renewal",
          gate: ["canIssueNextInvoice", "!isNextInvoiceDateInFuture"],
          i18n: { title: "labs.contract_product_late_renewal" },
          variant: "warning",
          icon: "alert-circle"
        }
      ]
    },
    {
      kind: "fields",
      key: "details",
      i18n: "labs.record_details",
      icon: "box",
      elements: contractProductSummary
    },
    {
      kind: "fields",
      key: "options",
      i18n: "labs.record_options",
      icon: "layers-three-01",
      elements: contractProductOptions
    },
    {
      kind: "fields",
      key: "billing",
      i18n: "labs.record_billing",
      icon: "receipt",
      elements: [
        ...contractProductBilling,
        ...contractSummary({
          base: `${RAW}/contract/properties`,
          prefixed: true,
          // cProdPaymentMethodComp.vue:64.
          paymentMethod: `${RAW}/contract/properties/payment_details/properties/name`
        })
      ],
      actions: [
        {
          name: "open-contract",
          i18n: "labs.record_open_contract",
          icon: "arrow-right",
          placement: RecordActionPlacementTypes.ROW,
          navigate: {
            route: "/useContract/:id",
            idScope: "#/properties/contractId"
          }
        }
      ]
    },
    {
      kind: "collection",
      key: "tickets",
      // The product's own tickets, read through the ticket COLLECTION booted
      // for this product (`.for(TicketsContextTypes.CONTRACT_PRODUCT, id)`).
      scope: "#/properties/tickets",
      source: {
        use: useTickets,
        actor: ScopeActorTypes.CLIENT,
        context: {
          type: TicketsContextTypes.CONTRACT_PRODUCT,
          idScope: "#/properties/id"
        }
      },
      rowTitle: ["#/properties/subject", "#/properties/reference"],
      rowIcon: "message-question-circle",
      row: ticketSummary,
      rowActions: [
        {
          name: "open-ticket",
          i18n: "labs.ticket_open",
          icon: "arrow-right",
          placement: RecordActionPlacementTypes.ROW,
          navigate: { route: "/useTicket/:id", idScope: "#/properties/id" }
        }
      ]
    }
  ],
  actions: [
    {
      name: "change-of-plan",
      i18n: "action.upgrade_downgrade",
      icon: "switch-horizontal-01",
      placement: RecordActionPlacementTypes.HEADER,
      variant: "primary",
      gate: "canMigrate",
      navigate: { query: { init: "upgrade" } }
    },
    {
      name: "cancellation",
      i18n: "labs.contract_product_cancellation_open",
      icon: "x-close",
      color: RecordActionColorTypes.DANGER,
      gate: "hasCancellationOptions",
      run: "openCancellation",
      form: {
        context: "cancellation",
        set: "set",
        target: ContractProductFormTypes.CANCELLATION,
        submit: "submitCancellation",
        cancel: "cancelForm",
        valid: "isCancellationValid",
        i18n: "labs.contract_product_cancellation",
        submitI18n: "labs.contract_product_cancellation_submit"
      }
    },
    {
      name: "consolidation",
      i18n: "labs.contract_product_consolidation_open",
      icon: "receipt",
      gate: "canConsolidate",
      run: "openConsolidation",
      form: {
        context: "consolidation",
        set: "set",
        target: ContractProductFormTypes.CONSOLIDATION,
        submit: "submitConsolidation",
        cancel: "cancelForm",
        valid: "isConsolidationValid",
        i18n: "labs.contract_product_consolidation",
        submitI18n: "labs.contract_product_consolidation_submit"
      }
    },
    {
      name: "enable-auto-renew",
      i18n: "labs.contract_product_auto_renew_enable",
      icon: "refresh-cw-01",
      gate: "canEnableAutoRenew",
      form: {
        ...autoRenewForm(true),
        i18n: "labs.contract_product_auto_renew_enable"
      }
    },
    {
      name: "disable-auto-renew",
      i18n: "labs.contract_product_auto_renew_disable",
      icon: "x-close",
      gate: "canDisableAutoRenew",
      form: {
        ...autoRenewForm(false),
        i18n: "labs.contract_product_auto_renew_disable"
      }
    },
    {
      name: "issue-next-invoice",
      i18n: "labs.contract_product_next_invoice",
      icon: "receipt",
      /**
       * @decision
       * what: the action is gated on `canIssueNextInvoice` alone.
       * why: a record action takes one `gate` string and has no uischema `rule`,
       *   so `!#/issuedInvoice/id` cannot join it; the playground engine is frozen.
       * rejected: a meta flag that folds `issuedInvoice` into the gate (a headless change, out of scope).
       */
      gate: "canIssueNextInvoice",
      navigate: { query: { [QUERY_PARAMS.INIT]: InitIntent.NEXT_INVOICE } }
    },
    {
      name: "view-invoice",
      i18n: "labs.contract_product_view_invoice",
      icon: "arrow-right",
      gate: ISSUED_INVOICE_ID,
      navigate: { route: "/useInvoice/:id", idScope: ISSUED_INVOICE_ID }
    },
    {
      name: "end-trial",
      i18n: "labs.contract_product_end_trial",
      icon: "check",
      gate: "canEndTrial",
      navigate: { query: { [QUERY_PARAMS.INIT]: InitIntent.END_TRIAL } }
    },
    {
      name: "client-label",
      i18n: "labs.contract_product_label_open",
      icon: "edit-01",
      placement: RecordActionPlacementTypes.OVERFLOW,
      gate: "canUpdateContractProduct",
      form: {
        schema: {
          type: "object",
          properties: { clientLabel: { type: ["string", "null"] } }
        },
        uischema: {
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/clientLabel",
              i18n: "labs.contract_product_label_field"
            }
          ]
        } satisfies VerticalLayout,
        prefill: true,
        submit: "setClientLabel",
        args: ["#/properties/clientLabel"],
        i18n: "labs.contract_product_label_open",
        submitI18n: "labs.contract_product_label_save"
      }
    },
    {
      name: "billing-entity",
      i18n: "labs.contract_product_billing_entity_open",
      icon: "building-02",
      placement: RecordActionPlacementTypes.OVERFLOW,
      gate: "canSetBillingEntity",
      run: "openBillingEntity",
      form: {
        context: "billingEntity",
        set: "set",
        target: ContractProductFormTypes.BILLING_ENTITY,
        submit: "submitBillingEntity",
        cancel: "cancelForm",
        valid: "isBillingEntityValid",
        i18n: "labs.contract_product_billing_entity_open",
        submitI18n: "labs.contract_product_billing_entity_save"
      }
    },
    {
      name: "withdraw",
      i18n: "labs.contract_product_withdraw",
      placement: RecordActionPlacementTypes.OVERFLOW,
      gate: "isCancelling",
      run: "withdrawCancellation"
    },
    {
      name: "resume",
      i18n: "labs.contract_product_resume",
      placement: RecordActionPlacementTypes.OVERFLOW,
      gate: "isExpiring",
      run: "resumeRenewing"
    },
    {
      name: "revoke-scheduled",
      i18n: "labs.contract_product_revoke_scheduled",
      placement: RecordActionPlacementTypes.OVERFLOW,
      gate: "hasScheduledFutureCancellation",
      run: "revokeScheduledCancellation"
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
      i18n: "labs.contract_product_reset",
      icon: "flip-backward",
      placement: RecordActionPlacementTypes.UTILITY,
      run: "reset"
    }
  ],
  picker: {
    use: useContractProducts,
    actor: ScopeActorTypes.CLIENT,
    schema: "schemas.contractProductPicker",
    field: "contractProduct",
    icon: "box",
    i18n: {
      title: "labs.contract_product_needs_id",
      text: "labs.contract_product_needs_id_text",
      input: "labs.contract_product_id_label",
      open: "labs.contract_product_open"
    }
  }
};
