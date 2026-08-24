// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientReceivedEmails/client-email-history.scenario
 * @description The client-email-history scenario — ONE module, ONE declaration
 * (`R6-27`). It proves the detail FETCH path: `useList` is the collection and
 * `useDetail` is the single read a row opens, so a `detail` control opens the
 * overlay and the read fills in the full record (its `body`) the row need not
 * carry.
 *
 * The DIRECTORY is the url segment and route name (`/useClientReceivedEmails`),
 * so nothing here declares a route. Nor a scope: the page boots as self with no
 * context, and only the url's `/as/:actor` and `/for/:type/:id` segments move it
 * — and since both composables serve only `client`, the page is driven at
 * `/as/client` (`R6-30b`).
 */

import {
  useClientReceivedEmail,
  useClientReceivedEmails
} from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./client-email-history.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_EMAIL_HISTORY_SCENARIO = "client_email_history";

export default {
  key: CLIENT_EMAIL_HISTORY_SCENARIO,
  useList: useClientReceivedEmails,
  useDetail: useClientReceivedEmail,
  persistCriteria: true,
  // The MODULE whose committed `.feature` and step catalog this page plays.
  tracks: "client-email-history",
  presentation: {
    icon: "mail-01",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
