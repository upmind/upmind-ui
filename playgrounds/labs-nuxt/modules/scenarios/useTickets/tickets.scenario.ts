// -----------------------------------------------------------------------------
/**
 * @module scenarios/useTickets/tickets.scenario
 * @description The support-tickets scenario — the client×self ticket
 * collection (`useTickets`) as the list. No `useMutate`: see
 * `tickets.presentation.ts`'s module docblock for why no handoff is
 * declared.
 *
 * No `useDetail` either, DELIBERATELY: the manager (`useTicket`)
 * addresses its ticket through `.as('client').withId(id)` off a `/:id` route
 * param (operator review, 2026-09-22 — a ticket is a leaf record, not an
 * ADR-001 context). The runtime's generic detail fetch
 * (`useModulePort.ts`) only ever calls `scoped.withId(scope.id)`, never
 * `.for()`, so binding `useTicket` as `useDetail` here would boot it
 * with no ticket context at all — a silently broken fetch, not a working
 * one. The detail overlay instead draws the clicked row's OWN data (omitting
 * `useDetail` is exactly this, per `scenario.types.ts`'s `ResolvedDetail`
 * docblock) — which loses nothing: `Ticket` is `ITicket` un-reduced
 * (`tickets.types.ts`), so the list row already carries `contract_product`,
 * `settings.lock` and `department` in full.
 *
 * The FILE is named for the module it declares and the DIRECTORY is the url
 * segment and the route name (`/useTickets`), so nothing here declares
 * a route and nothing can misname one. Nor does it declare a scope: the page
 * boots as self with no context, and only the url's `/as/:actor` and
 * `/for/:type/:id` segments move it — offering only what the module's own
 * scope matrix serves. `TICKETS_SCOPE_MATRIX` (`tickets.types.ts`) declares
 * ONE member, on the `client` row: `product`, the tickets raised about one of
 * my contract products (AC-7). So `/useTickets/as/client/for/product/<id>`
 * is a real url here and the scope bar offers that member; every other type
 * is refused by `servesContext` rather than silently resolving the default.
 * `.for('client', id)` stays forbidden (R1) and is not a member — a list is
 * never retargeted at another client, which is a different axis from the
 * entity it is read ABOUT.
 */

import { useTicket, useTickets } from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./tickets.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const TICKETS_SCENARIO = "tickets";

export default {
  key: TICKETS_SCENARIO,
  useList: useTickets,
  // The row's `view` fetches ONE ticket by record id through the generic
  // single-read overlay — possible only since the manager is keyed by id
  // (review 2026-09-22), never by a scope context.
  useDetail: useTicket,
  persistCriteria: true,
  // The MODULE whose committed `.feature` and step catalog this page plays —
  // the same module the ticket page tracks, because the catalog is keyed by
  // module and serves both keys. The feature tags every scenario `@collection`
  // or `@manager`, so this page leaves the manager's out: replying to a ticket
  // and renaming its subject are the detail page's, and listing them here
  // offered a control this surface cannot honestly drive.
  tracks: { module: "tickets", without: ["@manager"] },
  presentation: {
    icon: "message-question-circle",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
