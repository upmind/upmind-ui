// -----------------------------------------------------------------------------
/**
 * @module factory/registry
 * @description THE scenario contract for this playground — the
 * only place that holds both scenario keys, so the only place their
 * correlation can live. The portal and any customer app write their own; a
 * row→editor relation is consumer knowledge, not core's.
 *
 * `satisfies Record<ScenarioKey, ScenarioBinding>` is the whole point: a key
 * added to `@upmind-automation/headless/scenarios` and not declared here fails
 * to compile, so a module reaches the factory as a registry entry and zero new
 * files.
 */

import {
  ClientEmailContextTypes,
  ClientEmailsContextTypes,
  ScopeActorTypes,
  useClientEmailManager,
  useClientEmails
} from "@upmind-automation/headless";
import scenarios, {
  CLIENT_EMAIL_SCENARIO,
  CLIENT_EMAILS_SCENARIO
} from "@upmind-automation/headless/scenarios";
import { keys } from "lodash-es";
import type { ScenarioBinding } from "./registry.types";
import type { ScenarioKey } from "@upmind-automation/headless/scenarios";
import type { ScenarioRegistry } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export const registry = {
  [CLIENT_EMAILS_SCENARIO]: {
    useList: useClientEmails,
    useMutate: useClientEmailManager,
    scope: {
      actor: ScopeActorTypes.CLIENT,
      contextType: ClientEmailsContextTypes.CLIENT
    },
    persistCriteria: true,
    handoff: {
      edit: {
        target: CLIENT_EMAIL_SCENARIO,
        contextType: ClientEmailContextTypes.EMAIL,
        contextFrom: "/id"
      }
    }
  },
  [CLIENT_EMAIL_SCENARIO]: {
    useList: useClientEmailManager,
    scope: {
      actor: ScopeActorTypes.CLIENT,
      contextType: ClientEmailContextTypes.EMAIL
    }
  }
} satisfies Record<ScenarioKey, ScenarioBinding>;

/**
 * The harness registry stays exactly what F-1 defined — keys → boot thunks.
 * Annotated rather than `satisfies`-ed: the annotation checks key coverage the
 * same way AND widens the thunk's return to `unknown`, without which
 * `createHarness` infers `T` from the first entry alone and every later key
 * reds against that one module's cell shape.
 */
export const scenarioRegistry: ScenarioRegistry<ScenarioKey, unknown> =
  scenarios;

/** Every declared key, in declaration order — what the playground loops. */
export const scenarioKeys = keys(registry) as ScenarioKey[];
