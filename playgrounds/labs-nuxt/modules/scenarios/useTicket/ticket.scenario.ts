// -----------------------------------------------------------------------------
/**
 * @module scenarios/useTicket/ticket.scenario
 * @description One support ticket, MANAGED — the client×self manager
 * (`useTicket`) drawn as its own page: the merged message thread, a
 * reply composer, the close/reopen lifecycle, the subject editor and the
 * per-record meta flags. The sibling of the COLLECTION page
 * (`useTickets`), which lists tickets but drives none of the manager's
 * 19 members.
 *
 * The shared playground draws it as a RECORD: `useManage` plus the declared
 * `presentation.record` (`ticket.presentation.ts`) route it to the record
 * surface, which builds the header, the fields, the thread (its views, paging,
 * per-message and per-file writes and the reply composer), every write and its
 * drawer from that declaration against the live manager. No page file draws it.
 *
 * The DIRECTORY is the url segment and route name (`/useTicket`). The
 * ticket is addressed by the `id` route param declared below —
 * `/useTicket/<id>` — which the registrar turns into a `/:id` segment;
 * the page reads it off the route and boots
 * `.as(ScopeActorTypes.CLIENT).withId(id)` (R11 — enum members, no cast;
 * `TICKET_SCOPE_MATRIX` serves CLIENT alone).
 *
 * No module-specific playground spec is owed here or anywhere in this lane
 * (operator ruling, 2026-09-28) — self-drawn or not.
 *
 * `useManage` is what the harness builds the boot thunk for its key from, and
 * `tracks` names the module whose committed `.feature` and step catalog this
 * page plays — the same module the COLLECTION page tracks, since the catalog is
 * keyed by module and serves both keys.
 */

import { ScopeActorTypes, useTicket } from "@upmind-automation/headless";
import { ticketRecord } from "./ticket.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const TICKET_SCENARIO = "ticket";

export default {
  key: TICKET_SCENARIO,
  // `useList` / `useMutate` stay OMITTED: the manager draws as a RECORD.
  useManage: useTicket,
  // `TICKET_SCOPE_MATRIX` takes no `.for()` context at any actor, so it marks
  // every actor `never`; the client is the one actor this manager serves.
  actors: [ScopeActorTypes.CLIENT],
  // The ticket is addressed by a path param — `/useTicket/:id` — the same
  // shape `useInvoice` uses for its own single record. It rode the scope's
  // `/for/ticket/:id` context segment until an operator review on 2026-09-22:
  // a single ticket is an INSTANCE (`.withId(id)`), and `.for()` retargets a
  // relationship the actor acts upon. Nothing new is built for this — the
  // registrar already turns a declared param into a route segment, and
  // `useModulePort` already boots `.withId(scope.id)`. OPTIONAL, because the
  // bare url is the picker state — with no id the page offers the lookup.
  // UUID-shaped, because the scope suffix follows it: without the pattern,
  // `/useTicket/as/client` resolves `id = "as"` and the actor is lost.
  params: ["id([0-9a-fA-F-]{36})?"],
  // The MODULE whose committed `.feature` and step catalog this page plays —
  // the same module the collection page tracks, because the catalog is keyed by
  // module and serves both keys. The feature tags every scenario `@collection`
  // or `@manager`, so this page leaves the collection's out: paging, sorting and
  // filtering a list are the listing page's, and one ticket has no list to page.
  // The desk lookup, the status vocabulary and the composer preferences read as
  // ticket concerns and are not: all three fire `useTickets` actions, so
  // they are tagged `@collection` and excluded here too.
  tracks: { module: "tickets", without: ["@collection"] },
  presentation: {
    icon: "message-question-circle",
    record: ticketRecord
  }
} satisfies ScenarioDeclaration;
