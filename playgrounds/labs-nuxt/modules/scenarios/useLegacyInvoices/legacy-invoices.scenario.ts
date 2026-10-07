// -----------------------------------------------------------------------------
/**
 * @module scenarios/useLegacyInvoices/legacy-invoices.scenario
 * @description The legacy-invoices scenario — ONE module, ONE declaration:
 * which composables boot, how a row draws, and which module's committed
 * scenarios the page plays.
 *
 * The FILE is named for the module it declares and the DIRECTORY is the url
 * segment and the route name (`/useLegacyInvoices`), so nothing here
 * declares a route. Nor does it declare a scope: the page boots as self with
 * no context, and only the url's `/as/:actor` segment moves it — both scope
 * matrices are all-`never` (ruling OD1), so `.for(type, id)` never COMPILES
 * against either composable (AC-13). The archive hangs off no parent entity.
 * Neither composable registers a runtime matrix, so `servesContext` refuses a
 * hand-typed `/for/:type/:id` segment on this route.
 *
 * No `useMutate` and no `handoff` — the archive is read-only + PDF, never a
 * write surface (AC-13, FE-3230 Out of Scope). `useDetail: useLegacyInvoice`
 * is earned instead: the single read's `.withId(id)` boots off the clicked
 * row's own `id`, and its all-`never` scope matrix refuses `.for()` while
 * leaving `.as()` intact.
 */

import {
  useLegacyInvoice,
  useLegacyInvoices
} from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./legacy-invoices.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const LEGACY_INVOICES_SCENARIO = "legacy-invoices";

export default {
  key: LEGACY_INVOICES_SCENARIO,
  useList: useLegacyInvoices,
  useDetail: useLegacyInvoice,
  // The MODULE whose committed `.feature` and step catalog this page plays.
  tracks: "legacy-invoices",
  // The composable exposes a list-criteria surface, so a hand's filter/sort
  // survives a reload (D11).
  persistCriteria: true,
  presentation: {
    icon: "archive",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
