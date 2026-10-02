// -----------------------------------------------------------------------------
/**
 * @module scenarios/useInvoice/invoice.scenario
 * @description One invoice, read whole — the invoices module's single-record
 * read, and the screen a client lands on from an emailed invoice link.
 *
 * This module DRAWS ITSELF: `invoice.page.vue` beside this file is the route's
 * component, so the shared renderer never sees it. The reason is `useInvoice`,
 * which is FLAT — it publishes no `.as(actor)` builder, so it cannot be a
 * `useList` and the declared table, card and detail surfaces have nothing to
 * bind to. The page reaches the composable directly.
 *
 * Registration is unchanged by that: the key, the icon, the url segment and the
 * sidebar entry all come from here, exactly as they do for a playground-drawn
 * module.
 *
 * `useManage` opts the page into a playlist (the `useTicket` precedent): the
 * page mounts its own `ScenarioBar` and plays the module's `@detail`
 * scenarios, leaving the collection page's `@collection` ones out.
 */

import { useInvoice } from "@upmind-automation/headless";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const INVOICE_SCENARIO = "invoice";

export default {
  key: INVOICE_SCENARIO,
  // The invoice is addressed by a path param — `/useInvoice/:oid` — the same word
  // `/order/:oid` uses, so an emailed link works with the id in the path.
  params: ["oid([0-9a-fA-F-]{36})?"],
  useManage: useInvoice,
  tracks: { module: "invoices", without: ["@collection"] },
  presentation: {
    icon: "receipt"
  }
} satisfies ScenarioDeclaration;
