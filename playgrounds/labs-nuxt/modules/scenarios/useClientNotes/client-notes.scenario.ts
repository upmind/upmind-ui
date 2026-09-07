// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientNotes/client-notes.scenario
 * @description The client-notes scenario — ONE module, ONE declaration: which
 * composables boot, the editor its rows hand off to, how the record draws, and
 * which module's committed scenarios the page plays.
 *
 * The FILE is named for the module it declares and the DIRECTORY is the url
 * segment and the route name (`/useClientNotes`), so nothing here declares a
 * route and nothing can misname one. Nor does it declare a scope: the page
 * boots as self with no context, and only the url's `/as/:actor` and
 * `/for/:type/:id` segments move it — offering only what the module's own
 * scope matrix serves (`client` only; `staff`/`guest` are compile-time errors
 * on the composable itself, per the operator cell ruling recorded in
 * `client-notes.types.ts`).
 */

import {
  ClientNoteContextTypes,
  useClientNoteManager,
  useClientNotes
} from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./client-notes.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_NOTES_SCENARIO = "client_notes";

/**
 * What the editor's save says either way — the same sentence from both
 * halves. The manager has no `ensure` capability of its own (unlike
 * client-phone/address/company): a fresh draft and an existing asset are the
 * SAME `useClientNoteManager().useActions().update()` call, one on a
 * `.fresh()` boot and one on an id-scoped one, so one feedback pair covers
 * both.
 */
const SAVE_FEEDBACK = {
  success: "confirm.vault_asset_saved",
  failure: "error.client_notes_update_failed"
};

export default {
  key: CLIENT_NOTES_SCENARIO,
  useList: useClientNotes,
  useMutate: useClientNoteManager,
  persistCriteria: true,
  // Both halves of the editor's job are the SAME editor: the record it opens on
  // is what decides whether its save creates or updates, so `add` names no
  // context at all and `edit` points at the row's own id.
  handoff: {
    add: { feedback: SAVE_FEEDBACK },
    edit: {
      context: { type: ClientNoteContextTypes.NOTE, from: "/id" },
      feedback: SAVE_FEEDBACK
    }
  },
  // The MODULE whose committed `.feature` and step catalog this page plays.
  tracks: "client-notes",
  presentation: {
    icon: "layers-three-01",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
