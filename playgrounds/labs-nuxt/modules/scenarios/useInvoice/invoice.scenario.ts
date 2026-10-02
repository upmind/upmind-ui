// -----------------------------------------------------------------------------
/**
 * @module scenarios/useInvoice/invoice.scenario
 * @description One invoice, read whole — the invoices module's single-record
 * read (`useInvoice`), and the screen a client lands on from an emailed invoice
 * link. The sibling of the COLLECTION page (`useInvoices`).
 *
 * The shared playground draws it as a RECORD: `useManage` plus the declared
 * `presentation.record` (`invoice.presentation.ts`) route it to the record
 * surface, which boots `.withId(id)` for the url's invoice, or the invoice an
 * armed track's recording addressed. With no id it draws the collection's own
 * picker (`useInvoices().useContext().schemas.invoicePicker`).
 *
 * The page plays the module's `@detail` scenarios, leaving the collection
 * page's `@collection` ones out.
 */

import { useInvoice } from "@upmind-automation/headless";
import { invoiceRecord } from "./invoice.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const INVOICE_SCENARIO = "invoice";

export default {
  key: INVOICE_SCENARIO,
  useManage: useInvoice,
  // `oid`, not `id`: the word `/order/:oid` uses and the `?init=pay` overlay
  // reads off its parent's params. UUID-shaped, because the scope suffix
  // follows it.
  params: ["oid([0-9a-fA-F-]{36})?"],
  tracks: { module: "invoices", without: ["@collection"] },
  presentation: {
    icon: "receipt",
    record: invoiceRecord
  }
} satisfies ScenarioDeclaration;
