// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientCustomPages/client-custom-pages.scenario
 * @description The client-custom-pages scenario — ONE module, ONE declaration
 * (`R6-27`). It proves the DETAIL FETCH-OR-SHORT-CIRCUIT path (AC4/O9/O10/O11):
 * `useList` is the collection and `useDetail` is the single read a row opens,
 * keyed by the row's own `slug` (not `id` — the module's `.withId(slug)`
 * contract). `useDetail`'s own `enabled` gate
 * (`client-custom-pages.services.ts`'s `loadOne`) resolves an already-loaded
 * row from the SAME-actor `useList` instance with no further request; a
 * `detail` control opened before `useList` has ever fetched fetches
 * normally, same as before this capability landed.
 *
 * The DIRECTORY is the url segment and route name
 * (`/useClientCustomPages`), so nothing here declares a route. Nor a scope:
 * the page boots as self with no context, and only the url's `/as/:actor` and
 * `/for/:type/:id` segments move it — and since both doors serve `guest` and
 * `client` alike (AC9), the page is driveable at `/as/client` with no
 * session, per parity O5/guest×self.
 */

import {
  useClientCustomPage,
  useClientCustomPages
} from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./client-custom-pages.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_CUSTOM_PAGES_SCENARIO = "client_custom_pages";

export default {
  key: CLIENT_CUSTOM_PAGES_SCENARIO,
  useList: useClientCustomPages,
  useDetail: useClientCustomPage,
  // The single-read door keys on the route SLUG, never the wire `id`
  // (`templates/SINGLE-READ.md` — a record id is not a scope context).
  identifier: "slug",
  persistCriteria: true,
  // The MODULE whose committed `.feature` and step catalog this page plays.
  tracks: "client-custom-pages",
  presentation: {
    // "file-05" is an Untitled-UI name with no lucide equivalent (AC-10);
    // "columns-03" (lucide Columns3) reads as a page-layout glyph and
    // resolves through the map (`icon-map.ts`).
    icon: "columns-03",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
