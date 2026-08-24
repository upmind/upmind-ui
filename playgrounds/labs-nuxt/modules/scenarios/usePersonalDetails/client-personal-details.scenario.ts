// -----------------------------------------------------------------------------
/**
 * @module scenarios/usePersonalDetails/client-personal-details.scenario
 * @description The client-personal-details scenario — ONE module, ONE
 * declaration (`R6-27`): a client's own profile, read as a row-per-field
 * collection and edited through the SAME entity's editor.
 *
 * The DIRECTORY is the url segment and route name (`/usePersonalDetails`), so
 * nothing here declares a route. Nor a scope: the page boots as self with no
 * context, and only the url's `/as/:actor` and `/for/:type/:id` segments move
 * it (`R6-30b`) — and since both composables serve only `client`
 * (`PERSONAL_DETAILS_SCOPE_MATRIX`), the page is driven at `/as/client`.
 */

import {
  usePersonalDetails,
  usePersonalDetailsManager
} from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./client-personal-details.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_PERSONAL_DETAILS_SCENARIO = "client_personal_details";

/** What the editor's save says either way. */
const SAVE_FEEDBACK = {
  success: "confirm.profile_saved",
  failure: "error.client_personal_details_update_failed"
};

export default {
  key: CLIENT_PERSONAL_DETAILS_SCENARIO,
  useList: usePersonalDetails,
  useMutate: usePersonalDetailsManager,
  identifier: "id",
  // `useDetail` is omitted — there is no single-record fetch composable, and
  // the row already carries everything an overlay would show (design.md D3:
  // omitted means the overlay would render the clicked row's own data with
  // no fetch; this declares no `detail` control at all, so it never opens).
  //
  // `persistCriteria` is omitted — there is no criteria to persist, since
  // this module owns no query schema (`parity.yaml` `not_owed`).
  handoff: {
    // No `context` — a profile-field ROW carries no client id to retarget an
    // edit onto (`ProfileField.id` is the FIELD's own identity), so this is
    // fired from a HEADER control with no row, which the runtime already
    // boots with no context (`ListSurface.vue`'s `pressCollectionAction` /
    // `openHandoff`).
    edit: { feedback: SAVE_FEEDBACK },
    // Row-level edit: narrows the editor to ONE field. The `fieldScope.from`
    // pointer reads the row's `code` property, which names the field (native
    // field name or custom field code). The editor draws only that control;
    // save stays diff-only, so only that field is sent.
    editField: {
      fieldScope: { from: "/fieldPath" },
      feedback: SAVE_FEEDBACK
    }
  },
  // The MODULE whose committed `.feature` and step catalog this page plays.
  tracks: "client-personal-details",
  presentation: {
    icon: "user-01",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
