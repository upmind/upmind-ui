// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — the SHARED SUMMARY of one record (D34). Doctrine wins over
 * this skeleton and the built summaries it cites
 * (`useContract/contract.summary.ts`,
 * `useContractProduct/contract-product.summary.ts`). Authority:
 * `playgrounds/labs-nuxt/modules/scenarios/docs/record.md` § Shared summaries.
 *
 * Emitted by the DEVELOPER seat, beside `{module}.presentation.ts`.
 */

import { RuleEffect } from "@jsonforms/core";
import { compact } from "lodash-es";
import type { TableCell } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------
/**
 * @module scenarios/useModuleManager/module.summary
 * @description ONE module summary, shared by the module's own record (its
 * Details section) and every record that shows a module (one section per
 * item), so the two can never draw a module differently. It is declared HERE
 * and imported by both sides — never copied, never declared twice. Where two
 * records already show the same thing, the fields MOVE here and each side
 * imports them.
 *
 * Scopes read the mapped record (`module.mappers.ts`); a value the mapper keeps
 * only on `raw` is read off `#/properties/raw/properties/…`, cited.
 */

const RAW = "#/properties/raw/properties";

/**
 * What the module IS, in draw order. A fixed summary is a `TableCell[]`; use
 * the function form below when the base scope or the label set varies by the
 * record that embeds it.
 */
export const moduleSummary: TableCell[] = [
  { type: "TableCellStatus", scope: "#/properties/status", i18n: "text.status" },
  { type: "TableCellText", scope: "#/properties/name", i18n: "text.name" },
  {
    type: "TableCellDate",
    scope: "#/properties/dateCreated",
    i18n: "text.date_created"
  },
  {
    type: "TableCellText",
    scope: `${RAW}/quantity`,
    i18n: "labs.record_quantity",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: `${RAW}/quantity`,
        schema: { type: "number", exclusiveMinimum: 1 }
      }
    }
  }
];

/** The function form: the caller names the base scope and what only it carries. */
export type ModuleSummarySource = {
  /** The record's own `raw`, or another record's `raw.<module>`. */
  base: string;
  /** Scopes only one side's data carries; a side passing none draws without them. */
  extra?: string;
  /** Selects the label set that NAMES the module when it sits inside another record. */
  prefixed?: boolean;
};

const PLAIN = { name: "text.name", extra: "text.extra" };
const PREFIXED = { name: "labs.record_module_name", extra: "labs.record_module_extra" };

/**
 * The module's summary fields where the embedding record varies the base.
 *
 * @param source The base scope, the optional side-only scope, the label set.
 * @returns The fields, in draw order.
 */
export function moduleSummaryFor(source: ModuleSummarySource): TableCell[] {
  const label = source.prefixed ? PREFIXED : PLAIN;

  const cells: (TableCell | false)[] = [
    { type: "TableCellText", scope: `${source.base}/name`, i18n: label.name },
    !!source.extra && {
      type: "TableCellText",
      scope: source.extra,
      i18n: label.extra
    }
  ];

  return compact(cells);
}
