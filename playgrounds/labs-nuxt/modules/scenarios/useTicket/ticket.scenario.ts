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
 * This module DRAWS ITSELF: `ticket.page.vue` beside this file is the
 * route's component (`../index.ts` — "the module's own page wins"), so the
 * shared `ScenarioPlayground`/`ModuleRenderer` never sees it. What keeps it
 * self-drawn is the WRITE side only: the reply composer, the subject editor
 * and the product link take an argument, the manager publishes no form
 * `schema`/`model` for them, and ACTION_PANEL fires every action
 * argument-free. The READ side no longer needs this page — the collection
 * (`useTickets`) declares `useDetail: useTicket`, so a row's `view` fetches
 * one ticket `.withId(id)` and the generic detail overlay draws it in full,
 * conversation included (`TableCellList` over the manager's `feed`).
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
 * ## The playlist this page DOES carry (FE-3226)
 * Drawing itself no longer means playing nothing. `useManage` is the opt-in a
 * self-drawn declaration makes so the harness can build a boot thunk for its
 * key (`registry.ts`), and `tracks` names the module whose committed `.feature`
 * and step catalog the page plays — the same two artefacts the COLLECTION page
 * reads, since `stepCatalogs` is keyed by MODULE and one catalog serves both
 * keys. The page mounts `ScenarioBar` itself; the generic renderer is still
 * never involved.
 *
 * Neither member changes how the page is DRAWN, and neither is inferred: a
 * self-drawn declaration naming neither stays exactly where it was — outside
 * `boundKeys`, Live-only, and `World.boot` on its key still throws. The other
 * self-drawing declarations name neither.
 */

import { useTicket } from "@upmind-automation/headless";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const TICKET_SCENARIO = "ticket";

export default {
  key: TICKET_SCENARIO,
  // `useList` / `useMutate` stay OMITTED — the module draws itself, and no
  // generic surface can render a message thread or a reply composer (see
  // docblock). `useManage` is the self-drawn page's own opt-in: it binds the
  // manager for BOOTING only, so `World.boot("ticket", …)` builds a
  // thunk, and the page keeps drawing every pixel itself.
  useManage: useTicket,
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
    icon: "message-question-circle"
  }
} satisfies ScenarioDeclaration;
