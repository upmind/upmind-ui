// -----------------------------------------------------------------------------
/**
 * @module scenarios/useInvoices/invoices.scenario
 * @description The invoices scenario — ONE module, ONE declaration: which
 * composables boot, how the record draws, and which module's committed
 * scenarios the page plays.
 *
 * The FILE is named for the module it declares and the DIRECTORY is the url
 * segment and the route name (`/useInvoices`), so nothing here declares a
 * route and nothing can misname one. Nor does it declare a scope: the page
 * boots as self with no context, and only the url's `/as/:actor` and
 * `/for/:type/:id` segments move it — offering only what the module's own
 * scope matrix serves. The client cell holds four RETARGET members —
 * `client`, `contract`, `contracts_product`, `invoice` (FE-3031 F3 / OR-1) —
 * so the acting-for picker offers each and every pick drives the list. The
 * picker's form is the module's own (`useContext().schemas.lookups`), its
 * relationship controls bound to the module's lookups; nothing here declares
 * it. `self`/`staff`/`guest` stay compile-time errors on `.for()`, per the
 * operator cell ruling recorded in `invoices.types.ts`'s `INVOICES_SCOPE_MATRIX`.
 *
 * No `useMutate` — the module ships no manager (no create-form schema pair), so
 * there is no create control and no `handoff`. `useDetail: useInvoice` is the
 * scoped single-invoice read: booted off the clicked row's `id` via
 * `.withId(id)`, its all-`never` matrix refuses `.for()` while `.as()` resolves,
 * so the read overlay exercises the full single-invoice fetch.
 */

import { useInvoice, useInvoices } from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  noticesUischema,
  tableUischema
} from "./invoices.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const INVOICES_SCENARIO = "invoices";

export default {
  key: INVOICES_SCENARIO,
  useList: useInvoices,
  useDetail: useInvoice,
  persistCriteria: true,
  // The MODULE whose committed `.feature` and step catalog this page plays.
  tracks: "invoices",
  presentation: {
    icon: "tag-02",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema,
    notices: noticesUischema
  }
} satisfies ScenarioDeclaration;
