/**
 * @module scenarios/runtime/components/__tests__/resolved-handoffs
 * @description The client-emails page's declared handoffs, resolved the way the
 * playground resolves them (`R6-27`): the declaration's OWN `useMutate` drives
 * every one of them, at the actor the collection itself is driven at. A handoff
 * names no second declaration and an editor needs no directory of its own.
 *
 * Built from `useClientEmails/scenario.ts`'s own `handoff` map rather than
 * restated, so a declaration that drops or renames a handoff changes what the
 * specs are handed instead of leaving them asserting a shape nobody declares.
 */

import { ScopeActorTypes } from "@upmind-automation/headless";
import clientEmails from "../../../useClientEmails/client-email.scenario";
import { mapValues, pick } from "lodash-es";
import type {
  FourLayerComposable,
  ResolvedHandoff
} from "../../scenario.types";

/** A page boots as self; a seeded client session is what makes that the client. */
const DRIVEN_AT = ScopeActorTypes.CLIENT;

export const RESOLVED_HANDOFFS: Record<string, ResolvedHandoff> = mapValues(
  clientEmails.handoff,
  declared => ({
    ...declared,
    useMutate: clientEmails.useMutate as FourLayerComposable,
    actor: DRIVEN_AT
  })
);

/** The same map with only the named handoffs registered — the rest go unoffered. */
export const handoffsFor = (...names: string[]) =>
  pick(RESOLVED_HANDOFFS, names);
