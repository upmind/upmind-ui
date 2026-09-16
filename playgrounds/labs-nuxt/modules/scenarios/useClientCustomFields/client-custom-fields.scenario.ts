// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientCustomFields/client-custom-fields.scenario
 * @description The client-custom-fields scenario — ONE module, ONE
 * declaration (`R6-27`): the definitions collection, how a row draws, and
 * which module's committed scenarios the page plays. No `useMutate` — this
 * module mints no manager for the definitions collection (not_owed #2 in
 * `docs/sdd/client-custom-fields-upgrade/parity.yaml`); `ScenarioDeclaration`
 * (`scenario.types.ts:466`) makes it optional. No `handoff` — with no editor,
 * there is no row to hand off to.
 *
 * The DIRECTORY is the url segment and the route name
 * (`/useClientCustomFields`), so nothing here declares a route. Nor a scope:
 * the page boots as self with no context, and only the url's `/as/:actor` and
 * `/for/:type[/:id]` segments move it — offering only what the module's own
 * scope matrix serves.
 *
 * THE CATALOGUE PICKER IS NOT DECLARED HERE, and that is the point (FE-3034).
 * The catalogue is a SELECTOR context on the module's own scope matrix, so
 * `ScenarioPlayground`'s `registerContexts(port.scopeMatrix)` hands the scope
 * bar `invoice` and `contract_request` for free, and `/for/invoice` boots the
 * page on that catalogue. No second construction channel exists: naming no
 * context IS choosing the client catalogue.
 *
 * DATA BOUNDS: only the client catalogue has recorded rows. The
 * `contract_request` catalogue reaches the wire, but staging has none
 * configured, so it answers with zero rows — read that as "no recorded rows",
 * never as proof no data exists.
 */

import { useClientCustomFields } from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./client-custom-fields.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_CUSTOM_FIELDS_SCENARIO = "client_custom_fields";

export default {
  key: CLIENT_CUSTOM_FIELDS_SCENARIO,
  useList: useClientCustomFields,
  persistCriteria: true,
  // The MODULE whose committed `.feature` and step catalog this page plays.
  tracks: "client-custom-fields",
  presentation: {
    icon: "list",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
