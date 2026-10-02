// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContract/contract.summary
 * @description ONE contract summary, shared by the contract record (its
 * Details section) and the contract-product record (its Billing section), so
 * the two can never draw a contract differently. It reads a wire `IContract`
 * under the base the caller names — the contract's own `raw`, or the product's
 * `raw.contract` — because the product read carries the contract only raw.
 * Fields only one side's data carries are passed in as scopes; a side that
 * passes none draws without them.
 */

import { RuleEffect } from "@jsonforms/core";
import { compact } from "lodash-es";
import type { ContractSummarySource } from "./contract.types";
import type { TableCell } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const PLAIN = {
  number: "labs.record_number",
  status: "text.status",
  billingCycle: "text.billing_cycle",
  paymentMethod: "text.payment_method",
  nextDue: "text.next_due_date",
  total: "text.total",
  start: "labs.record_start_date"
};

const PREFIXED = {
  number: "labs.record_contract_number",
  status: "labs.record_contract_status",
  billingCycle: "labs.record_contract_billing_cycle",
  paymentMethod: "labs.record_contract_payment_method",
  nextDue: "labs.record_contract_next_due",
  total: "labs.record_contract_total",
  start: "labs.record_contract_start"
};

/**
 * The contract's summary fields.
 *
 * @param source The wire-contract base, the scopes only one side carries, and
 * whether labels name the contract (inside another record) or not (its own).
 * @returns The fields, in draw order.
 */
export function contractSummary(source: ContractSummarySource): TableCell[] {
  const { base, billingCycle, paymentMethod } = source;
  const label = source.prefixed ? PREFIXED : PLAIN;

  const cells: (TableCell | false)[] = [
    {
      type: "TableCellText",
      scope: `${base}/main_invoice_number`,
      i18n: label.number
    },
    {
      type: "TableCellStatus",
      scope: `${base}/status`,
      i18n: label.status
    },
    !!billingCycle && {
      type: "TableCellText",
      scope: billingCycle,
      i18n: label.billingCycle
    },
    !!paymentMethod && {
      type: "TableCellText",
      scope: paymentMethod,
      i18n: label.paymentMethod
    },
    {
      type: "TableCellDate",
      scope: `${base}/next_due_date`,
      i18n: label.nextDue,
      rule: {
        effect: RuleEffect.SHOW,
        condition: {
          scope: `${base}/billing_cycle_months`,
          schema: { type: "number", exclusiveMinimum: 0 }
        }
      }
    },
    {
      type: "TableCellText",
      scope: `${base}/total_amount_formatted`,
      i18n: label.total
    },
    {
      type: "TableCellDate",
      scope: `${base}/start_date`,
      i18n: label.start
    }
  ];

  return compact(cells);
}
