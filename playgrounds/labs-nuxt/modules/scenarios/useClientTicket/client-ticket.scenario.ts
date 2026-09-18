// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientTicket/client-ticket.scenario
 * @description One support ticket, MANAGED — the client×self manager
 * (`useClientTicket`) drawn as its own page: the merged message thread, a
 * reply composer, the close/reopen lifecycle, the subject editor and the
 * per-record meta flags. The sibling of the COLLECTION page
 * (`useClientTickets`), which lists tickets but drives none of the manager's
 * 19 members.
 *
 * This module DRAWS ITSELF: `client-ticket.page.vue` beside this file is the
 * route's component (`../index.ts` — "the module's own page wins"), so the
 * shared `ScenarioPlayground`/`ModuleRenderer` never sees it. The reason is
 * structural, not a stub: none of the four generic surfaces (LIST, FORM_FLOW,
 * DETAIL, ACTION_PANEL) can draw this manager. It publishes no query criteria
 * and no array (`useClientTicket.context.ts` returns one `data` record, a
 * merged `feed`, `department`, `relatedProduct`), so it is neither a list nor
 * a table; it publishes no form `schema`/`model`, so FORM_FLOW draws an empty
 * form; and ACTION_PANEL fires every action argument-free, so `reply(body)`
 * and `setSubject(subject)` would fire with `undefined`, and the feed thread
 * has no renderer at all. A generic binding here would be a page that offers
 * states it can never show (the exact empty-form / dead-control trap the
 * collection page's own docblock refused). The page reaches the composable
 * directly instead.
 *
 * The DIRECTORY is the url segment and route name (`/useClientTicket`), so
 * nothing here declares a route. The ticket is addressed through the scope
 * suffix — `/useClientTicket/as/client/for/ticket/<id>` — which the shared
 * scope middleware parses into `route.meta.scopeConfig`; the page reads the
 * id from there and boots `.as(ScopeActorTypes.CLIENT).for(TicketContextTypes.TICKET, id)`
 * (R11 — enum members, no cast; `TICKET_SCOPE_MATRIX` serves CLIENT alone).
 *
 * No forced-surface spec is owed: that harness boots a bound composable
 * through `useModulePort` with no scope context, so `.for()` never fires and
 * no ticket loads — a self-drawing page carries none, exactly as `useInvoice`,
 * `useContractProduct` and `usePaymentDetailAdd` carry none.
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

import { useClientTicket } from "@upmind-automation/headless";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_TICKET_SCENARIO = "client_ticket";

export default {
  key: CLIENT_TICKET_SCENARIO,
  // `useList` / `useMutate` stay OMITTED — the module draws itself, and no
  // generic surface can render a message thread or a reply composer (see
  // docblock). `useManage` is the self-drawn page's own opt-in: it binds the
  // manager for BOOTING only, so `World.boot("client_ticket", …)` builds a
  // thunk, and the page keeps drawing every pixel itself.
  useManage: useClientTicket,
  // The MODULE whose committed `.feature` and step catalog this page plays —
  // the same module the collection page tracks, because the catalog is keyed by
  // module and serves both keys. The feature tags every scenario `@collection`
  // or `@manager`, so this page leaves the collection's out: paging, sorting and
  // filtering a list are the listing page's, and one ticket has no list to page.
  // The desk lookup, the status vocabulary and the composer preferences read as
  // ticket concerns and are not: all three fire `useClientTickets` actions, so
  // they are tagged `@collection` and excluded here too.
  tracks: { module: "tickets", without: ["@collection"] },
  presentation: {
    icon: "message-question-circle"
  }
} satisfies ScenarioDeclaration;
