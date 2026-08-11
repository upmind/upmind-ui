// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientEmails/scenario
 * @description The client-email COLLECTION scenario — the canary. One
 * directory, one declaration: which composable boots, at which scope, which
 * editor its rows hand off to, and how the whole thing draws.
 *
 * The directory name IS the url segment and the route name
 * (`/useClientEmails/as/client`), so nothing here declares a route and nothing
 * can misname one.
 */

import {
  ClientEmailContextTypes,
  ClientEmailsContextTypes,
  ScopeActorTypes,
  useClientEmailManager,
  useClientEmails
} from "@upmind-automation/headless";
import { CLIENT_EMAIL_SCENARIO } from "../useClientEmail/scenario";
import {
  cardUischema,
  collectionActions,
  rowActions,
  rowUischema
} from "./client-emails.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_EMAILS_SCENARIO = "client_emails";

export default {
  key: CLIENT_EMAILS_SCENARIO,
  useList: useClientEmails,
  useMutate: useClientEmailManager,
  scope: {
    actor: ScopeActorTypes.CLIENT,
    contextType: ClientEmailsContextTypes.CLIENT
  },
  persistCriteria: true,
  // Both halves of the editor's job are the SAME target: the record the handoff
  // carries is what decides whether its save creates or updates, so `add`
  // declares no `contextFrom` and edit points at the row's own id.
  handoff: {
    add: {
      target: CLIENT_EMAIL_SCENARIO,
      contextType: ClientEmailContextTypes.EMAIL
    },
    edit: {
      target: CLIENT_EMAIL_SCENARIO,
      contextType: ClientEmailContextTypes.EMAIL,
      contextFrom: "/id"
    }
  },
  nav: { icon: "mail-01" },
  presentation: {
    row: rowUischema,
    card: cardUischema,
    rowActions,
    collectionActions
  }
} satisfies ScenarioDeclaration;
