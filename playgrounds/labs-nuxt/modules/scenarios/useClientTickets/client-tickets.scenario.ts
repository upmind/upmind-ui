// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientTickets/client-tickets.scenario
 * @description The support-tickets scenario — the client×self ticket
 * collection (`useClientTickets`) as the list. No `useMutate`: see
 * `client-tickets.presentation.ts`'s module docblock for why no handoff is
 * declared.
 *
 * No `useDetail` either, DELIBERATELY: the manager (`useClientTicket`) is
 * ruled (R1, `useClientTicket.ts`'s own docblock) to address its ticket
 * through `.as('client').for('ticket', id)` — `ticket` is a genuine ADR-001
 * context, not a leaf record — and `SINGLE-READ.md`'s `.withId(id)` is
 * OVERRULED for this module. The runtime's generic detail fetch
 * (`useModulePort.ts`) only ever calls `scoped.withId(scope.id)`, never
 * `.for()`, so binding `useClientTicket` as `useDetail` here would boot it
 * with no ticket context at all — a silently broken fetch, not a working
 * one. The detail overlay instead draws the clicked row's OWN data (omitting
 * `useDetail` is exactly this, per `scenario.types.ts`'s `ResolvedDetail`
 * docblock) — which loses nothing: `Ticket` is `ITicket` un-reduced
 * (`tickets.types.ts`), so the list row already carries `contract_product`,
 * `settings.lock` and `department` in full.
 *
 * The FILE is named for the module it declares and the DIRECTORY is the url
 * segment and the route name (`/useClientTickets`), so nothing here declares
 * a route and nothing can misname one. Nor does it declare a scope: the page
 * boots as self with no context, and only the url's `/as/:actor` and
 * `/for/:type/:id` segments move it — offering only what the module's own
 * scope matrix serves (`client` only; the run constraint forbids
 * `.for('client', id)` outright, so the collection's own matrix refuses
 * every actor — `TICKETS_SCOPE_MATRIX` in `tickets.types.ts`).
 */

import { useClientTickets } from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./client-tickets.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_TICKETS_SCENARIO = "client_tickets";

export default {
  key: CLIENT_TICKETS_SCENARIO,
  useList: useClientTickets,
  persistCriteria: true,
  // The MODULE whose committed `.feature` and step catalog this page plays.
  tracks: "tickets",
  presentation: {
    icon: "message-question-circle",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
