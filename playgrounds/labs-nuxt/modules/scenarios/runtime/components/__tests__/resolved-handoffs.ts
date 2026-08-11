/**
 * @module scenarios/runtime/components/__tests__/resolved-handoffs
 * @description The canary's declared handoffs, resolved the way the playground
 * resolves them — each declaration's `target` looked up to the target's own
 * scenario, at the actor the collection itself is driven at.
 *
 * Built from `useClientEmails/scenario.ts`'s own `handoff` map rather than
 * restated, so a declaration that drops or renames a handoff changes what the
 * specs are handed instead of leaving them asserting a shape nobody declares.
 */

import clientEmail, {
  CLIENT_EMAIL_SCENARIO
} from "../../../useClientEmail/scenario";
import clientEmails from "../../../useClientEmails/scenario";
import { mapValues, pick } from "lodash-es";
import type { RegisteredScenario, ResolvedHandoff } from "../../scenario.types";

/** The one registered target the canary hands off to. */
export const EMAIL_EDITOR: RegisteredScenario = {
  ...clientEmail,
  route: "useClientEmail"
};

const REGISTRY: Record<string, RegisteredScenario> = {
  [CLIENT_EMAIL_SCENARIO]: EMAIL_EDITOR
};

export const RESOLVED_HANDOFFS: Record<string, ResolvedHandoff> = mapValues(
  clientEmails.handoff,
  declared => ({
    scenario: REGISTRY[declared.target] as RegisteredScenario,
    actor: clientEmails.scope.actor,
    contextFrom: declared.contextFrom
  })
);

/** The same map with only the named handoffs registered — the rest go unoffered. */
export const handoffsFor = (...names: string[]) =>
  pick(RESOLVED_HANDOFFS, names);
