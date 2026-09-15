// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientNotifications/client-notifications.scenario
 * @description The client-notifications scenario — ONE module, ONE
 * declaration: the notification-preferences grid, read as a row-per-topic
 * collection and edited through the SAME account's draft.
 *
 * The DIRECTORY is the url segment and route name (`/useClientNotifications`),
 * so nothing here declares a route. Nor a scope: the page boots as self with
 * no context, and only the url's `/as/:actor` segment moves it — this
 * module's matrices declare no `.for()` context at all (ruling A), so the
 * `/for/:type/:id` segment is never reachable here (AC-13).
 *
 * The module is client-only: a signed-in client, or an unauthenticated client
 * arriving on `/as/client?token=` with the emailed link token. Staff is denied
 * and there is no guest case.
 *
 * See `client-notifications.presentation.ts` for the honest, surfaced limit
 * on what this generic harness can drive (`toggle` is not expressible here).
 */

import {
  ScopeActorTypes,
  useClientNotifications,
  useClientNotificationsManager
} from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./client-notifications.presentation";
import { usePreferencesLink } from "./usePreferencesLink";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_NOTIFICATIONS_SCENARIO = "client_notifications";

/** What the editor's save says either way — the same sentence from both halves. */
const SAVE_FEEDBACK = {
  success: "confirm.notification_preferences_saved",
  failure: "error.client_notifications_update_failed"
};

export default {
  key: CLIENT_NOTIFICATIONS_SCENARIO,
  useList: useClientNotifications,
  useMutate: useClientNotificationsManager,
  identifier: "id",
  // `useDetail` is omitted — there is no single-record fetch composable, and
  // the row already carries everything the overlay shows.
  //
  // `persistCriteria` is omitted — the criteria schema declares only
  // `pagination.limit.default = 0` and no filters/sort branch at all (ruling
  // B, `design.md` §D2); there is nothing filter/sort state to persist to
  // the url. D14/D15 not applicable, D16 satisfied — cite ruling B, never
  // re-derive.
  //
  // Operator ruling (c), tier 1: the shared playground runtime is untouched
  // (`ListSurface.vue`, `runtime/scenario.types.ts`) — the page is closed
  // from the MODULE side. `client-notifications.schemas.ts` now publishes a
  // REAL derived schema/uischema pair (topics x channels, `design.md` §D13),
  // so `manage` names NO context at all: this module declares no `.for()`
  // context (ruling A), and the editor is one account-wide aggregate, not a
  // per-row record — it boots the SAME self scope the collection is driven
  // at, and `FormFlowSurface.vue`'s existing `handoff` form path draws the
  // grid with ZERO shared-runtime change (AC-14).
  handoff: {
    manage: { feedback: SAVE_FEEDBACK },
    // Row-level edit: narrows the SAME draft editor to the clicked TOPIC's own
    // channels. `fieldScope.from` reads the row's `id` (the topic), which the
    // manager's `uischemaFor` expands to that topic's grid controls; save stays
    // diff-only, so only that topic is sent — the profile page's per-field edit
    // (`usePersonalDetails` `editField`), applied to one row of a grid.
    editRow: {
      fieldScope: { from: "/id" },
      feedback: SAVE_FEEDBACK
    }
  },
  // The `/as/client` cell the page offers beyond the implicit SELF. Both
  // matrices are all-`never` by ruling A (every endpoint is session-implicit, so
  // no context exists to name), which `useModulePort` would otherwise read as
  // "not offered". Naming client here says the page offers it: the caller is
  // identified by the active client session, or by the `?token=` link the
  // runtime threads onto the client cell. Staff is not listed, so it stays
  // refused; there is no guest cell.
  actors: [ScopeActorTypes.CLIENT],
  // One labs orchestration, not a cell action. `generatePreferencesLink` mints a
  // fresh preferences link for the signed-in client and opens this page on
  // `/as/client?token=`.
  pageActions: {
    generatePreferencesLink: {
      i18n: "action.notification_generate_preferences_link",
      icon: "link-external-01",
      variant: "outline",
      use: usePreferencesLink
    }
  },
  tracks: "client-notifications",
  presentation: {
    icon: "bell-01",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
