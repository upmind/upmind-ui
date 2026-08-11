// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientEmail/scenario
 * @description The per-email MANAGER scenario — the editor a collection row
 * hands off to. It declares only `useList`: the pairing is a relation between
 * two keys, not a property of one, and an editor has no editor of its own.
 *
 * It is a handoff TARGET, so the navigation derivation excludes it — one
 * composable family, one menu item (P1-R8) — which is why it carries no `nav`.
 */

import {
  ClientEmailContextTypes,
  ScopeActorTypes,
  useClientEmailManager
} from "@upmind-automation/headless";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the collection's `handoff.edit.target`. */
export const CLIENT_EMAIL_SCENARIO = "client_email";

export default {
  key: CLIENT_EMAIL_SCENARIO,
  useList: useClientEmailManager,
  scope: {
    actor: ScopeActorTypes.CLIENT,
    contextType: ClientEmailContextTypes.EMAIL
  }
} satisfies ScenarioDeclaration;
