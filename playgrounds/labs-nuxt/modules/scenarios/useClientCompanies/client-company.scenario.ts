// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientCompanies/client-company.scenario
 * @description The client-company scenario — ONE module, ONE declaration
 * (`R6-27`): which composables boot, the editor its rows hand off to, how the
 * record draws, and which module's committed scenarios the page plays.
 *
 * The FILE is named for the module it declares and the DIRECTORY is the url
 * segment and the route name (`/useClientCompanies`), so nothing here
 * declares a route and nothing can misname one. Nor does it declare a scope:
 * the page boots as self with no context, and only the url's `/as/:actor`
 * and `/for/:type/:id` segments move it (`R6-30b`).
 */

import {
  ClientCompanyContextTypes,
  useClientCompanies,
  useClientCompanyManager
} from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./client-company.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_COMPANIES_SCENARIO = "client_companies";

/** What the editor's save says either way — the same sentence from both halves. */
const SAVE_FEEDBACK = {
  success: "confirm.company_saved",
  failure: "error.client_company_update_failed"
};

export default {
  key: CLIENT_COMPANIES_SCENARIO,
  useList: useClientCompanies,
  useMutate: useClientCompanyManager,
  persistCriteria: true,
  // Both halves of the editor's job are the SAME editor: the record it opens
  // on is what decides whether its save creates or updates, so `add` names no
  // context at all and `edit` points at the row's own id.
  handoff: {
    add: { feedback: SAVE_FEEDBACK },
    edit: {
      context: { type: ClientCompanyContextTypes.COMPANY, from: "/id" },
      feedback: SAVE_FEEDBACK
    }
  },
  // The MODULE whose committed `.feature` and step catalog this page plays.
  tracks: "client-company",
  presentation: {
    icon: "building-01",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
