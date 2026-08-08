// -----------------------------------------------------------------------------
/**
 * @module factory/registry
 * @description THE scenario contract for this playground (ruling S-D4) — the
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
  CLIENT_EMAIL_SCENARIO,
  CLIENT_EMAILS_SCENARIO,
  ClientEmailContextTypes,
  ClientEmailsContextTypes,
  ScopeActorTypes,
  useClientEmailManager,
  useClientEmails
} from "@upmind-automation/headless";
import scenarios from "@upmind-automation/headless/scenarios";
import { useCompositionPort } from "./useCompositionPort";
import { useTableChannel } from "./useTableChannel";
import { get, isFunction, keys } from "lodash-es";
import type { ScenarioBinding, ScenarioScopedCell } from "./registry.types";
import type { TableChannelCell } from "./useTableChannel";
import type { ScenarioKey } from "@upmind-automation/headless/scenarios";
import type {
  CompositionPort,
  ScenarioRegistry
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export const registry = {
  [CLIENT_EMAILS_SCENARIO]: {
    useList: useClientEmails,
    useMutate: useClientEmailManager,
    scope: {
      actor: ScopeActorTypes.CLIENT,
      contextType: ClientEmailsContextTypes.CLIENT
    },
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

/**
 * True when the cell publishes the query criteria a controlled table channel
 * reads. Whether a scenario owns table state is DERIVED, never declared: the
 * cell publishes criteria or it does not.
 */
export function ownsQueryState(cell: ScenarioScopedCell): boolean {
  const context = cell.useContext();
  return !!get(context, "query") && !!get(context, ["schemas", "query"]);
}

/**
 * Boots one binding into the seam port at the scope the binding declares —
 * the whole of what used to be per-module port code.
 *
 * @param entry The binding, from {@link registry}.
 * @param scope Overrides — the actor a feature named, and the context id a
 * handoff (or a route) supplies. Absent, the binding's own scope is used.
 */
export function bootScenarioPort(
  entry: ScenarioBinding,
  scope: { actor?: ScopeActorTypes; contextId?: string } = {}
): CompositionPort {
  const scoped = entry.useList().as(scope.actor ?? entry.scope.actor);
  const cell =
    entry.scope.contextType && scope.contextId && isFunction(scoped.for)
      ? scoped.for(entry.scope.contextType, scope.contextId)
      : scoped;

  // `LiveContext` is deliberately opaque (`Record<string, unknown>`), so the
  // channel's structural cell shape is asserted once, here, behind the
  // `ownsQueryState` guard that just proved the members exist.
  return useCompositionPort(cell, {
    table: ownsQueryState(cell)
      ? useTableChannel(cell as unknown as TableChannelCell)
      : undefined
  });
}
